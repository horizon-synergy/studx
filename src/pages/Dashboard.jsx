import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getListingsBySeller,
  setListingAvailability,
  deleteListing,
  updateListing,
  getOrdersByBuyer,
  getOrdersBySeller,
  acceptOrder,
  declineOrder,
  fulfillOrder,
  confirmReceipt,
  raiseDispute,
  cancelUnpaidOrder,
  cancelPaidOrder,
  canCancelOrder,
  startFeaturedListingCheckout,
  startProSubscriptionCheckout,
  getProSubscriptionStatus,
  getUserProfile,
} from "../services/firebase";
import { formatPrice } from "../config/listing-config";
import { getCloudinaryThumbnail } from "../utils/cloudinary";
import { useAuth } from "../context/AuthContext";
import { useViewer } from "../context/ViewerContext";
import { useTheme, PRO_THEMES } from "../context/ThemeContext";
import AddListingTab from "../components/AddListingTab";
import CouponsTab from "../components/CouponsTab";
import SellerPayoutSetup from "../components/SellerPayoutSetup";
import StudentBadge from "../components/StudentBadge";
import StudentVerificationForm from "../components/StudentVerificationForm";
import s from "../styles/Dashboard.module.css";

const TABS = [
  { id: "listings", label: "My listings" },
  { id: "selling", label: "Orders (selling)" },
  { id: "buying", label: "Orders (buying)" },
  { id: "add", label: "Add listing" },
  { id: "coupons", label: "Coupons" },
  { id: "payouts", label: "Payouts" },
  { id: "verification", label: "Verification" },
];

function statusClass(status) {
  if (status === "pending") return s.statusPending;
  if (status === "approved") return s.statusApproved;
  if (status === "rejected") return s.statusRejected;
  return s.status;
}

function isFeaturedActive(listing) {
  const until = listing.featuredUntil;
  if (!until) return false;
  const ms = until.toMillis ? until.toMillis() : new Date(until).getTime();
  return ms > Date.now();
}

export default function Dashboard() {
  const { currentUser } = useAuth();
  const { guardViewer } = useViewer();
  const { proTheme, setProTheme } = useTheme();
  const [tab, setTab] = useState("listings");
  const [listings, setListings] = useState([]);
  const [buyOrders, setBuyOrders] = useState([]);
  const [sellOrders, setSellOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [proStatus, setProStatus] = useState(null);
  const [proLoading, setProLoading] = useState(true);
  const [myAccount, setMyAccount] = useState(null);

  const flash = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 3000);
  };

  const load = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [mine, buying, selling] = await Promise.all([
        getListingsBySeller(currentUser.uid),
        getOrdersByBuyer(currentUser.uid),
        getOrdersBySeller(currentUser.uid),
      ]);
      setListings(mine);
      setBuyOrders(buying);
      setSellOrders(selling);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!currentUser) return;
    setProLoading(true);
    Promise.all([
      getProSubscriptionStatus(currentUser.uid),
      getUserProfile(currentUser.uid),
    ])
      .then(([pro, account]) => {
        setProStatus(pro);
        setMyAccount(account);
      })
      .catch((err) => console.error(err))
      .finally(() => setProLoading(false));
  }, [currentUser?.uid]);

  const guard = () => {
    if (guardViewer()) return true;
    return false;
  };
  const isPro = proStatus?.status === "active";

  const onAvailability = async (id, availability) => {
    if (guard()) return;
    await setListingAvailability(id, availability);
    await load();
  };

  const onArchive = async (listing) => {
    if (guard()) return;
    await updateListing(listing.id, { archived: !listing.archived });
    await load();
  };

  const onDelete = async (id) => {
    if (guard()) return;
    if (!confirm("Delete this listing permanently?")) return;
    await deleteListing(id);
    await load();
  };

  const runOrder = async (fn, ...args) => {
    if (guard()) return;
    await fn(...args);
    await load();
  };

  const onCancelOrder = async (order) => {
    if (guard()) return;
    if (!confirm("Cancel this order?")) return;
    try {
      if (order.status === "awaiting_payment") {
        await cancelUnpaidOrder(order.id, currentUser.uid);
      } else {
        await cancelPaidOrder(order.id);
        flash("Cancelled and refunded");
      }
      await load();
    } catch (err) {
      console.error(err);
      flash(err.message || "Could not cancel order");
    }
  };

  const onGetStudXPlus = async (listingId) => {
    if (guard()) return;
    try {
      const { authorizationUrl, alreadyPaid } =
        await startFeaturedListingCheckout(listingId);
      if (alreadyPaid) {
        flash("Already featured");
        return;
      }
      window.location.href = authorizationUrl;
    } catch (err) {
      console.error(err);
      flash(err.message || "Could not start StudX+ checkout");
    }
  };

  const onGoPro = async () => {
    if (guard()) return;
    try {
      const { authorizationUrl, alreadyActive } =
        await startProSubscriptionCheckout();
      if (alreadyActive) {
        flash("StudX Pro is already active");
        return;
      }
      window.location.href = authorizationUrl;
    } catch (err) {
      console.error(err);
      flash(err.message || "Could not start StudX Pro checkout");
    }
  };

  return (
    <div className={s.page}>
      <header className={s.header}>
        <h1 className={s.title}>
          Dashboard{" "}
          {!proLoading && (
            <StudentBadge status={myAccount?.studentVerificationStatus} />
          )}
        </h1>
        <p className={s.sub}>Manage listings, orders, and coupons</p>
      </header>

      {msg && (
        <div className={s.empty} style={{ marginBottom: "1rem" }}>
          {msg}
        </div>
      )}

      {!proLoading && myAccount?.studentVerificationStatus !== "verified" && (
        <div className={`${s.banner} ${s.bannerWarn}`}>
          Not verified yet. Sign up with your university (.ac.za) email for
          automatic verification, or upload your student card in the
          Verification tab.
        </div>
      )}

      {!proLoading && myAccount?.role !== "vendor" && (
        <div className={s.banner}>
          <div>
            <div className={s.bannerTitle}>Sell food on StudX Eats</div>
            <div className={s.bannerNote}>
              Set up a kitchen/stall and start taking orders from students.
            </div>
          </div>
          <Link to="/vendor/signup" className={s.btn}>
            Become a vendor
          </Link>
        </div>
      )}

      {!proLoading && (
        <div className={`${s.banner} ${isPro ? s.bannerActive : ""}`}>
          {isPro ? (
            <div>
              <div className={s.bannerTitle}>StudX Pro is active ✓</div>
              <div className={s.bannerNote}>
                Seller analytics, StudX+ on all listings, a promoted week every
                month, and a lower marketplace commission.
              </div>
            </div>
          ) : (
            <>
              <div>
                <div className={s.bannerTitle}>StudX Pro — R75/month</div>
                <div className={s.bannerNote}>
                  Seller analytics, StudX+ included on every listing, a promoted
                  week every month, and a reduced commission.
                </div>
              </div>
              <button
                type="button"
                className={`${s.btn} ${s.btnPrimary}`}
                onClick={onGoPro}
              >
                Upgrade to Pro
              </button>
            </>
          )}
        </div>
      )}

      {isPro && (
        <div
          className={s.banner}
          style={{ flexDirection: "column", alignItems: "stretch" }}
        >
          <div className={s.bannerTitle}>StudX Pro theme</div>
          <div
            className={s.cardActions}
            style={{ justifyContent: "flex-start", marginTop: "0.5rem" }}
          >
            <button
              type="button"
              className={s.btn}
              onClick={() => setProTheme("")}
              style={
                proTheme === ""
                  ? { outline: "2px solid var(--brand-blue)" }
                  : undefined
              }
            >
              Default
            </button>
            {PRO_THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={s.btn}
                onClick={() => setProTheme(t.id)}
                style={
                  proTheme === t.id
                    ? { outline: "2px solid var(--brand-blue)" }
                    : undefined
                }
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={s.tabs}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`${s.tab} ${tab === t.id ? s.tabActive : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "add" && (
        <AddListingTab
          onCreated={() => {
            setTab("listings");
            load();
          }}
        />
      )}
      {tab === "coupons" && <CouponsTab />}
      {tab === "payouts" && <SellerPayoutSetup />}
      {tab === "verification" && <StudentVerificationForm />}

      {tab === "listings" &&
        (loading ? (
          <div className={s.loading}>
            <div className={s.spinner} />
          </div>
        ) : listings.length === 0 ? (
          <div className={s.empty}>
            No listings yet. Switch to Add listing to get started.
          </div>
        ) : (
          <div className={s.list}>
            {listings.map((l) => {
              const img = l.images?.[0] || l.imageUrl;
              const featured = isFeaturedActive(l);
              return (
                <div key={l.id} className={s.card}>
                  {img ? (
                    <img
                      className={s.thumb}
                      src={getCloudinaryThumbnail(img, 120, 120)}
                      alt=""
                    />
                  ) : (
                    <div className={s.thumbPh}>◈</div>
                  )}
                  <div>
                    <Link to={`/listing/${l.id}`} className={s.cardTitle}>
                      {l.title}
                    </Link>
                    <div className={s.cardMeta}>
                      {formatPrice(l.price, l.pricingModel)}
                      <span
                        className={`${s.status} ${statusClass(l.moderationStatus)}`}
                      >
                        {l.moderationStatus || "legacy"}
                      </span>
                      {l.archived && <span className={s.status}>archived</span>}
                      {featured && (
                        <span
                          className={s.status}
                          style={{
                            background: "rgba(245, 158, 11, 0.12)",
                            color: "#f59e0b",
                          }}
                        >
                          StudX+ active
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`${s.cardActions}`}>
                    <select
                      className={s.select}
                      value={l.availability || "available"}
                      onChange={(e) => onAvailability(l.id, e.target.value)}
                    >
                      <option value="available">Available</option>
                      <option value="reserved">Reserved</option>
                      <option value="sold">Sold</option>
                    </select>
                    {!featured && (
                      <button
                        type="button"
                        className={s.btn}
                        onClick={() => onGetStudXPlus(l.id)}
                      >
                        Get StudX+ · R15
                      </button>
                    )}
                    <button
                      type="button"
                      className={s.btn}
                      onClick={() => onArchive(l)}
                    >
                      {l.archived ? "Unarchive" : "Archive"}
                    </button>
                    <button
                      type="button"
                      className={`${s.btn} ${s.btnDanger}`}
                      onClick={() => onDelete(l.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

      {tab === "selling" &&
        (loading ? (
          <div className={s.loading}>
            <div className={s.spinner} />
          </div>
        ) : sellOrders.length === 0 ? (
          <div className={s.empty}>No seller orders yet.</div>
        ) : (
          <div className={s.list}>
            {sellOrders.map((o) => (
              <div key={o.id} className={s.orderCard}>
                <div className={s.orderTop}>
                  <div>
                    <div className={s.orderTitle}>
                      {o.listingTitle || "Order"}
                    </div>
                    <div className={s.orderMeta}>
                      Status: {o.status} · Buyer:{" "}
                      {o.buyerEmail || o.buyerId?.slice(0, 8)}
                    </div>
                  </div>
                  <div className={s.price}>
                    R{Number(o.price || 0).toFixed(2)}
                  </div>
                </div>
                <div className={s.orderActions}>
                  {o.status === "pending_seller" && (
                    <>
                      <button
                        type="button"
                        className={`${s.btn} ${s.btnSuccess}`}
                        onClick={() =>
                          runOrder(acceptOrder, o.id, currentUser.uid)
                        }
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className={`${s.btn} ${s.btnDanger}`}
                        onClick={() =>
                          runOrder(declineOrder, o.id, currentUser.uid)
                        }
                      >
                        Decline
                      </button>
                    </>
                  )}
                  {o.status === "accepted" && (
                    <button
                      type="button"
                      className={`${s.btn} ${s.btnPrimary}`}
                      onClick={() =>
                        runOrder(fulfillOrder, o.id, currentUser.uid)
                      }
                    >
                      Mark delivered
                    </button>
                  )}
                  {(o.status === "accepted" || o.status === "fulfilled") && (
                    <button
                      type="button"
                      className={s.btn}
                      onClick={() =>
                        runOrder(raiseDispute, o.id, currentUser.uid)
                      }
                    >
                      Dispute
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}

      {tab === "buying" &&
        (loading ? (
          <div className={s.loading}>
            <div className={s.spinner} />
          </div>
        ) : buyOrders.length === 0 ? (
          <div className={s.empty}>
            No purchases yet. Browse the marketplace to get started.
          </div>
        ) : (
          <div className={s.list}>
            {buyOrders.map((o) => (
              <div key={o.id} className={s.orderCard}>
                <div className={s.orderTop}>
                  <div>
                    <div className={s.orderTitle}>
                      {o.listingTitle || "Order"}
                    </div>
                    <div className={s.orderMeta}>Status: {o.status}</div>
                  </div>
                  <div className={s.price}>
                    R{Number(o.price || 0).toFixed(2)}
                  </div>
                </div>
                <div className={s.orderActions}>
                  {o.status === "fulfilled" && (
                    <button
                      type="button"
                      className={`${s.btn} ${s.btnPrimary}`}
                      onClick={() =>
                        runOrder(confirmReceipt, o.id, currentUser.uid)
                      }
                    >
                      Confirm receipt
                    </button>
                  )}
                  {["accepted", "fulfilled"].includes(o.status) && (
                    <button
                      type="button"
                      className={s.btn}
                      onClick={() =>
                        runOrder(raiseDispute, o.id, currentUser.uid)
                      }
                    >
                      Dispute
                    </button>
                  )}
                  {canCancelOrder(o) && (
                    <button
                      type="button"
                      className={s.btn}
                      onClick={() => onCancelOrder(o)}
                    >
                      Cancel order
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}
