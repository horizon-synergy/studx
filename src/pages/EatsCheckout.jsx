import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createFoodOrder, createFoodCheckout } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { useFoodCart } from "../context/FoodCartContext";
import { useViewer } from "../context/ViewerContext";
import s from "../styles/Checkout.module.css";

export default function EatsCheckout() {
  const { currentUser } = useAuth();
  const { items, setQty, removeItem, clear, total } = useFoodCart();
  const { guardViewer } = useViewer();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [pickupSpot, setPickupSpot] = useState("");

  const placeOrder = async () => {
    if (guardViewer()) return;
    if (!items.length) return;
    setBusy(true);
    setError("");
    try {
      const vendorId = items[0].vendorId;
      const vendorName = items[0].vendorName;
      const orderRef = await createFoodOrder({
        buyerId: currentUser.uid,
        buyerEmail: currentUser.email || "",
        vendorId,
        vendorName,
        items: items.map((i) => ({
          id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
        subtotal: total,
        total,
        note: note.trim(),
        pickupSpot: pickupSpot.trim(),
        // No payment provider involved — vendor is paid directly, out of app.
        status: "placed",
        paymentStatus: "pay_at_vendor",
      });

      await createFoodCheckout({
        buyerId: currentUser.uid,
        orderIds: [orderRef.id],
        vendorId,
        subtotal: total,
        total,
        lineItems: items.map((i) => ({
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
        status: "placed",
        paymentStatus: "pay_at_vendor",
      });

      clear();
      navigate("/eats");
    } catch (err) {
      console.error(err);
      setError(err.message || "Order failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={s.page}>
      <h1 className={s.title}>Checkout</h1>
      <p className={s.sub}>
        Review your order — pay the vendor directly on pickup/delivery.
      </p>
      {error && <div className={s.error}>{error}</div>}
      {/* ...existing items list / note / pickupSpot inputs, unchanged... */}
      <button
        type="button"
        className={`${s.btn} ${s.btnPrimary}`}
        onClick={placeOrder}
        disabled={busy || !items.length}
      >
        {busy ? "Placing…" : "Place order"}
      </button>
      <p className={s.hint}>
        You'll arrange payment with {items[0]?.vendorName || "the vendor"}{" "}
        directly. This just sends them your order.
      </p>
    </div>
  );
}
