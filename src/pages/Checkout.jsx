import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  validateCoupon,
  applyCouponToTotal,
  redeemCoupon,
  createOrder,
  createCheckout,
  startPaystackCheckout,
} from "../services/firebase";
import { getCloudinaryThumbnail } from "../utils/cloudinary";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useViewer } from "../context/ViewerContext";
import s from "../styles/Checkout.module.css";

const PAYMENTS_ENABLED = import.meta.env.VITE_YOCO_ENABLED !== "false";

export default function Checkout() {
  const { currentUser } = useAuth();
  const { items, removeFromCart, clearCart, total } = useCart();
  const { guardViewer } = useViewer();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [couponMsg, setCouponMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const { discountedTotal, savings, label } = applyCouponToTotal(total, coupon);

  const applyCode = async () => {
    setCouponMsg("");
    setError("");
    if (!code.trim()) return;
    try {
      const found = await validateCoupon(code.trim());
      if (!found) {
        setCoupon(null);
        setCouponMsg("Invalid or inactive code");
        return;
      }
      if (found.maxUses != null && found.usageCount >= found.maxUses) {
        setCoupon(null);
        setCouponMsg("Coupon usage limit reached");
        return;
      }
      if (found.sellerId) {
        const otherSeller = items.some((i) => i.sellerId !== found.sellerId);
        if (otherSeller) {
          setCoupon(null);
          setCouponMsg(
            "This coupon only applies to items from one seller. Remove other sellers' items first.",
          );
          return;
        }
      }
      setCoupon(found);
      setCouponMsg(
        `Applied: ${found.type === "percent" ? `${found.discount}%` : `R${found.discount}`} off`,
      );
    } catch (err) {
      setCouponMsg(err.message || "Could not validate coupon");
    }
  };

  const placeOrder = async () => {
    if (guardViewer()) return;
    if (!items.length) return;
    setBusy(true);
    setError("");
    try {
      const orderIds = [];
      const lineItems = [];
      for (const item of items) {
        const itemPrice = Number(item.price || 0);
        let finalPrice = itemPrice;
        if (coupon && (!coupon.sellerId || coupon.sellerId === item.sellerId)) {
          const ratio = total > 0 ? itemPrice / total : 0;
          finalPrice = parseFloat((itemPrice - savings * ratio).toFixed(2));
        }
        const ref = await createOrder({
          listingId: item.id,
          listingTitle: item.title,
          price: finalPrice,
          originalPrice: itemPrice,
          buyerId: currentUser.uid,
          buyerEmail: currentUser.email || "",
          sellerId: item.sellerId,
          couponId: coupon?.id || null,
          couponCode: coupon?.code || null,
          status: PAYMENTS_ENABLED ? "awaiting_payment" : "pending_seller",
          paymentStatus: PAYMENTS_ENABLED ? "pending" : "unpaid",
        });
        orderIds.push(ref.id);
        lineItems.push({ name: item.title, price: finalPrice, quantity: 1 });
      }

      const checkoutRef = await createCheckout({
        buyerId: currentUser.uid,
        orderIds,
        subtotal: total,
        discount: savings,
        total: discountedTotal,
        couponId: coupon?.id || null,
        lineItems,
        status: PAYMENTS_ENABLED ? "pending" : "placed",
        paymentStatus: PAYMENTS_ENABLED ? "pending" : "unpaid",
      });

      // NEW — link each order back to this checkout so cancelPaidOrder can find
      // the Paystack reference to refund against.
      await Promise.all(
        orderIds.map((oid) =>
          updateDoc(doc(db, "orders", oid), { checkoutId: checkoutRef.id }),
        ),
      );

      if (coupon?.id) await redeemCoupon(coupon.id);


      if (PAYMENTS_ENABLED) {
        const { authorizationUrl, alreadyPaid } = await startPaystackCheckout(
          checkoutRef.id,
        );
        clearCart();
        if (alreadyPaid) {
          navigate(
            `/payment/success?kind=marketplace&checkoutId=${checkoutRef.id}`,
          );
          return;
        }
        if (!authorizationUrl)
          throw new Error("No payment redirect URL returned");
        window.location.href = authorizationUrl;
        return;
      }

      clearCart();
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError(err.message || "Checkout failed");
    } finally {
      setBusy(false);
    }
  };

  if (!items.length) {
    return (
      <div className={s.page}>
        <h1 className={s.title}>Cart</h1>
        <div className={s.empty}>
          Your cart is empty. <Link to="/">Browse marketplace</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <h1 className={s.title}>Checkout</h1>
      <p className={s.sub}>
        {PAYMENTS_ENABLED
          ? "Review your items, then pay securely with Paystack"
          : "Review your items and place your order"}
      </p>

      {error && <div className={s.error}>{error}</div>}

      <div className={s.layout}>
        <div className={s.panel}>
          <h2 className={s.panelTitle}>Items ({items.length})</h2>
          {items.map((item) => {
            const img = item.images?.[0] || item.imageUrl;
            return (
              <div key={item.id} className={s.item}>
                {img ? (
                  <img
                    className={s.thumb}
                    src={getCloudinaryThumbnail(img, 100, 100)}
                    alt=""
                  />
                ) : (
                  <div className={s.thumb} />
                )}
                <div>
                  <div className={s.name}>{item.title}</div>
                  <div className={s.meta}>{item.sellerEmail || "Seller"}</div>
                  <button
                    type="button"
                    className={s.remove}
                    onClick={() => removeFromCart(item.id)}
                  >
                    Remove
                  </button>
                </div>
                <div className={s.price}>
                  R{Number(item.price || 0).toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>

        <div className={s.panel}>
          <h2 className={s.panelTitle}>Summary</h2>
          <div className={s.row}>
            <input
              className={s.input}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Coupon code"
            />
            <button type="button" className={s.btn} onClick={applyCode}>
              Apply
            </button>
          </div>
          {couponMsg && <p className={s.hint}>{couponMsg}</p>}
          <div className={s.totals}>
            <div className={s.line}>
              <span>Subtotal</span>
              <span>R{total.toFixed(2)}</span>
            </div>
            {savings > 0 && (
              <div className={`${s.line} ${s.savings}`}>
                <span>Discount ({label})</span>
                <span>−R{savings.toFixed(2)}</span>
              </div>
            )}
            <div className={s.total}>
              <span>Total</span>
              <span>R{discountedTotal.toFixed(2)}</span>
            </div>
          </div>
          <button
            type="button"
            className={`${s.btn} ${s.btnPrimary}`}
            onClick={placeOrder}
            disabled={busy || !items.length}
          >
            {busy
              ? "Processing…"
              : PAYMENTS_ENABLED
                ? "Pay with Paystack"
                : "Place order"}
          </button>
          <p className={s.hint}>
            {PAYMENTS_ENABLED
              ? "You\u2019ll be redirected to Paystack to complete card payment. Sellers are notified after payment succeeds."
              : "Orders are confirmed by the seller. Payment release is handled after both sides confirm delivery."}
          </p>
        </div>
      </div>
    </div>
  );
}
