import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  getPendingListings,
  approveListing,
  rejectListing,
  backfillLegacyListings,
  getAllOrders,
  releasePayment,
  adminUpdateOrderStatus,
  getAllUsers,
  setSellerVerified,
  setUserRole,
  getOrCreateDirectChat,
  getAllAds,
  createAd,
  deleteAd,
  toggleAd,
  getAllListings,
  setListingFeatured,
  setPromotedListing,
  clearPromotedListing,
  getPromotedListingSetting,
  getChatSettings,
  updateChatSettings,
  getAllFoodOrders,
  getAllVendors,
  getAllProSubscriptions,
  getAllStudentVerifications,
  reviewStudentVerification,
  backfillStudentVerification,
  getCommissionSettings,
  updateCommissionSettings,
} from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import AdminShell from "../components/AdminShell";
import s from "../styles/Admin.module.css";

const TABS = [
  { id: "moderation", label: "Moderation", icon: "\u2713" },
  { id: "orders", label: "Orders", icon: "\u25A4" },
  { id: "users", label: "Users", icon: "\u25CB" },
  { id: "verification", label: "Verification", icon: "\u25C6" },
  { id: "analytics", label: "Analytics", icon: "\u25B3" },
  { id: "ads", label: "Ads", icon: "\u25A2" },
  { id: "promoted", label: "Promoted", icon: "\u2605" },
  { id: "settings", label: "Settings", icon: "\u2699" },
];

const PAID_ORDER_STATUSES = [
  "pending_seller",
  "accepted",
  "fulfilled",
  "confirmed",
  "completed",
];
const DAY_MS = 86400000;
const CHART_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
];
const PRO_PRICE = 75;

function downloadBlob(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function buildAnalyticsMarkdown(a) {
  const today = new Date().toISOString().slice(0, 10);
  const lines = [];
  lines.push(`# StudX Admin Analytics — ${today}`);
  lines.push("");
  lines.push("## Marketplace");
  lines.push(`- **GMV (paid orders):** R${a.gmv.toFixed(2)}`);
  lines.push(`- **Paid orders:** ${a.paidOrderCount}`);
  lines.push(
    `- **Completed:** ${a.completedCount} · **Disputed:** ${a.disputedCount} · **Awaiting payment:** ${a.awaitingCount}`,
  );
  lines.push(`- **Orders this week:** ${a.ordersThisWeek}`);
  lines.push("");
  lines.push("## StudX Pro");
  lines.push(`- **Active subscribers:** ${a.activeProSubs}`);
  lines.push(`- **MRR:** R${a.mrr}`);
  lines.push("");
  lines.push("## Users");
  lines.push(`- **Total users:** ${a.totalUsers}`);
  lines.push(
    `- **New this week:** ${a.usersThisWeek} · **New this month:** ${a.usersThisMonth}`,
  );
  lines.push("");
  lines.push("## Listings");
  lines.push(
    `- **Approved:** ${a.approvedCount} · **Pending:** ${a.pendingCount} · **Rejected:** ${a.rejectedCount}`,
  );
  lines.push("");
  lines.push("## Top sellers by revenue");
  lines.push("| Seller | Paid orders | Revenue |");
  lines.push("|---|---|---|");
  a.topSellers.forEach((seller) => {
    lines.push(
      `| ${seller.email} | ${seller.orderCount} | R${seller.revenue.toFixed(2)} |`,
    );
  });
  lines.push("");
  lines.push("## Ads");
  lines.push(
    `- **Clicks:** ${a.totalClicks} · **Impressions:** ${a.totalImpressions} · **CTR:** ${a.ctr}%`,
  );
  lines.push("");
  lines.push("## StudX Eats");
  lines.push(
    "_No revenue figures — Eats has no in-app payment yet, buyers pay vendors directly._",
  );
  lines.push(
    `- **Active vendors:** ${a.activeVendors} (${a.vendorCount} total)`,
  );
  lines.push(
    `- **Food orders:** ${a.foodOrderCount} · **This week:** ${a.foodOrdersThisWeek}`,
  );
  lines.push("");
  lines.push("## Daily order trend (last 14 days)");
  lines.push("| Date | Orders | Revenue |");
  lines.push("|---|---|---|");
  a.dailyTrend.forEach((d) => {
    lines.push(`| ${d.label} | ${d.orders} | R${d.revenue.toFixed(2)} |`);
  });
  return lines.join("\n");
}

export default function Admin() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("moderation");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [pending, setPending] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [ads, setAds] = useState([]);
  const [listings, setListings] = useState([]);
  const [promotedId, setPromotedId] = useState("");
  const [ttlDays, setTtlDays] = useState(30);
  const [rejectReasons, setRejectReasons] = useState({});
  const [adForm, setAdForm] = useState({
    title: "",
    linkUrl: "",
    imageUrl: "",
    ctaLabel: "Learn more",
    active: true,
  });

  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsLoaded, setAnalyticsLoaded] = useState(false);
  const [foodOrders, setFoodOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [proSubscriptions, setProSubscriptions] = useState([]);

  const [verifications, setVerifications] = useState([]);
  const [verificationsLoading, setVerificationsLoading] = useState(false);
  const [verificationsLoaded, setVerificationsLoaded] = useState(false);
  const [backfillBusy, setBackfillBusy] = useState(false);

  const [commission, setCommission] = useState({
    enabled: false,
    baseRate: 10,
    proRate: 7,
  });
  const [commissionLoaded, setCommissionLoaded] = useState(false);
  const [commissionBusy, setCommissionBusy] = useState(false);

  const flash = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, o, u, a, l, promo, chat] = await Promise.all([
        getPendingListings(),
        getAllOrders(),
        getAllUsers(),
        getAllAds(),
        getAllListings(),
        getPromotedListingSetting(),
        getChatSettings(),
      ]);
      setPending(p);
      setOrders(o);
      setUsers(u);
      setAds(a);
      setListings(l);
      setPromotedId(promo?.listingId || "");
      setTtlDays(chat?.ttlDays ?? 30);
    } catch (err) {
      console.error(err);
      flash("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (tab !== "analytics" || analyticsLoaded) return;
    setAnalyticsLoading(true);
    Promise.all([getAllFoodOrders(), getAllVendors(), getAllProSubscriptions()])
      .then(([fo, v, ps]) => {
        setFoodOrders(fo);
        setVendors(v);
        setProSubscriptions(ps);
        setAnalyticsLoaded(true);
      })
      .catch((err) => {
        console.error(err);
        flash("Failed to load analytics data");
      })
      .finally(() => setAnalyticsLoading(false));
  }, [tab, analyticsLoaded]);

  const loadVerifications = useCallback(async () => {
    setVerificationsLoading(true);
    try {
      const list = await getAllStudentVerifications();
      setVerifications(list);
      setVerificationsLoaded(true);
    } catch (err) {
      console.error(err);
      flash("Failed to load verification requests");
    } finally {
      setVerificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab !== "verification" || verificationsLoaded) return;
    loadVerifications();
  }, [tab, verificationsLoaded, loadVerifications]);

  useEffect(() => {
    if (tab !== "settings" || commissionLoaded) return;
    getCommissionSettings()
      .then((c) => {
        setCommission(c);
        setCommissionLoaded(true);
      })
      .catch((err) => console.error(err));
  }, [tab, commissionLoaded]);

  const onApprove = async (id) => {
    await approveListing(id, currentUser.uid);
    flash("Listing approved");
    await load();
  };
  const onReject = async (id) => {
    await rejectListing(id, currentUser.uid, rejectReasons[id] || "");
    flash("Listing rejected");
    await load();
  };
  const onBackfill = async () => {
    const n = await backfillLegacyListings();
    flash(`Backfilled ${n} listings`);
    await load();
  };
  const onRelease = async (id) => {
    await releasePayment(id, currentUser.uid);
    flash("Payment released");
    await load();
  };
  const onOrderStatus = async (id, status) => {
    await adminUpdateOrderStatus(id, status, currentUser.uid);
    await load();
  };
  const onVerify = async (uid, verified) => {
    await setSellerVerified(uid, verified);
    await load();
  };
  const onRole = async (uid, role) => {
    await setUserRole(uid, role);
    await load();
  };
  const onMessageUser = async (u) => {
    const chat = await getOrCreateDirectChat(currentUser.uid, u.uid, u.email);
    navigate(`/messages/${chat.id}`);
  };
  const onCreateAd = async (e) => {
    e.preventDefault();
    await createAd(adForm);
    setAdForm({
      title: "",
      linkUrl: "",
      imageUrl: "",
      ctaLabel: "Learn more",
      active: true,
    });
    flash("Ad created");
    await load();
  };
  const onSavePromoted = async () => {
    if (!promotedId) await clearPromotedListing();
    else await setPromotedListing(promotedId, currentUser.uid);
    flash("Promoted listing updated");
  };
  const onFeature = async (id, featured) => {
    await setListingFeatured(id, featured);
    await load();
  };
  const onSaveChat = async () => {
    await updateChatSettings({ ttlDays: Number(ttlDays) || 30 });
    flash("Chat settings saved");
  };

  const onReviewVerification = async (uid, approve) => {
    try {
      await reviewStudentVerification(uid, approve);
      flash(approve ? "Approved" : "Rejected");
      setVerifications((prev) => prev.filter((v) => v.uid !== uid));
    } catch (err) {
      console.error(err);
      flash(err.message || "Failed to update verification");
    }
  };

  const onBackfillStudents = async () => {
    setBackfillBusy(true);
    try {
      const n = await backfillStudentVerification();
      flash(`Backfilled ${n} users with .ac.za emails`);
      await load();
    } catch (err) {
      console.error(err);
      flash(err.message || "Backfill failed");
    } finally {
      setBackfillBusy(false);
    }
  };

  const onSaveCommission = async () => {
    setCommissionBusy(true);
    try {
      await updateCommissionSettings({
        enabled: commission.enabled,
        baseRate: Number(commission.baseRate) || 0,
        proRate: Number(commission.proRate) || 0,
      });
      flash(
        commission.enabled
          ? "Commission is now LIVE for new subaccounts and renewals"
          : "Commission is OFF — everyone pays 0%",
      );
    } catch (err) {
      console.error(err);
      flash(err.message || "Could not save commission settings");
    } finally {
      setCommissionBusy(false);
    }
  };

  const analytics = useMemo(() => {
    const now = Date.now();
    const weekAgo = now - 7 * DAY_MS;
    const monthAgo = now - 30 * DAY_MS;
    const ts = (v) => (v?.createdAt?.seconds ? v.createdAt.seconds * 1000 : 0);

    const paidOrders = orders.filter((o) =>
      PAID_ORDER_STATUSES.includes(o.status),
    );
    const gmv = paidOrders.reduce((sum, o) => sum + Number(o.price || 0), 0);
    const completedOrders = orders.filter((o) => o.status === "completed");
    const disputedOrders = orders.filter((o) => o.status === "disputed");
    const awaitingOrders = orders.filter(
      (o) => o.status === "awaiting_payment",
    );
    const ordersThisWeek = orders.filter((o) => ts(o) >= weekAgo).length;
    const usersThisWeek = users.filter((u) => ts(u) >= weekAgo).length;
    const usersThisMonth = users.filter((u) => ts(u) >= monthAgo).length;

    const approvedListings = listings.filter(
      (l) => l.moderationStatus === "approved" && !l.archived,
    );
    const pendingListings = listings.filter(
      (l) => l.moderationStatus === "pending",
    );
    const rejectedListings = listings.filter(
      (l) => l.moderationStatus === "rejected",
    );

    const sellerMap = {};
    for (const o of paidOrders) {
      if (!o.sellerId) continue;
      if (!sellerMap[o.sellerId])
        sellerMap[o.sellerId] = { revenue: 0, orderCount: 0 };
      sellerMap[o.sellerId].revenue += Number(o.price || 0);
      sellerMap[o.sellerId].orderCount += 1;
    }
    const topSellers = Object.entries(sellerMap)
      .map(([sellerId, stats]) => {
        const user = users.find((u) => u.uid === sellerId);
        return {
          sellerId,
          email: user?.email || sellerId.slice(0, 8),
          ...stats,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const totalClicks = ads.reduce((sum, a) => sum + (a.clickCount || 0), 0);
    const totalImpressions = ads.reduce(
      (sum, a) => sum + (a.impressionCount || 0),
      0,
    );
    const ctr =
      totalImpressions > 0
        ? ((totalClicks / totalImpressions) * 100).toFixed(2)
        : "0.00";

    const activeVendors = vendors.filter((v) => v.active).length;
    const foodOrdersThisWeek = foodOrders.filter(
      (fo) => ts(fo) >= weekAgo,
    ).length;

    const activeProSubs = proSubscriptions.filter(
      (p) => p.status === "active",
    ).length;
    const mrr = activeProSubs * PRO_PRICE;

    const dailyTrend = [];
    for (let i = 13; i >= 0; i--) {
      const dayStart = now - i * DAY_MS;
      const dayLabel = new Date(dayStart).toLocaleDateString("en-ZA", {
        month: "short",
        day: "numeric",
      });
      const dayKey = new Date(dayStart).toDateString();
      const bucketOrders = paidOrders.filter(
        (o) => ts(o) && new Date(ts(o)).toDateString() === dayKey,
      );
      dailyTrend.push({
        label: dayLabel,
        orders: bucketOrders.length,
        revenue: bucketOrders.reduce((sum, o) => sum + Number(o.price || 0), 0),
      });
    }

    const listingStatusPie = [
      { name: "Approved", value: approvedListings.length },
      { name: "Pending", value: pendingListings.length },
      { name: "Rejected", value: rejectedListings.length },
    ].filter((d) => d.value > 0);

    return {
      gmv,
      paidOrderCount: paidOrders.length,
      completedCount: completedOrders.length,
      disputedCount: disputedOrders.length,
      awaitingCount: awaitingOrders.length,
      ordersThisWeek,
      totalUsers: users.length,
      usersThisWeek,
      usersThisMonth,
      approvedCount: approvedListings.length,
      pendingCount: pendingListings.length,
      rejectedCount: rejectedListings.length,
      topSellers,
      totalClicks,
      totalImpressions,
      ctr,
      vendorCount: vendors.length,
      activeVendors,
      foodOrderCount: foodOrders.length,
      foodOrdersThisWeek,
      activeProSubs,
      mrr,
      dailyTrend,
      listingStatusPie,
    };
  }, [orders, users, listings, ads, foodOrders, vendors, proSubscriptions]);

  const onExportMarkdown = () => {
    const md = buildAnalyticsMarkdown(analytics);
    downloadBlob(
      `studx-analytics-${new Date().toISOString().slice(0, 10)}.md`,
      md,
      "text/markdown",
    );
  };
  const onExportPdf = () => window.print();

  const tabsWithCounts = TABS.map((t) =>
    t.id === "verification" && verifications.length > 0
      ? { ...t, count: verifications.length }
      : t,
  );

  return (
    <AdminShell tabs={tabsWithCounts} activeTab={tab} onTabChange={setTab}>
      <h1 className={s.title}>Admin</h1>
      <p className={s.sub}>Moderation, users, ads, and platform settings</p>

      {msg && <div className={`${s.msg} ${s.msgOk} no-print`}>{msg}</div>}
      {loading && (
        <div className={s.loading}>
          <div className={s.spinner} />
        </div>
      )}

      {!loading && tab === "moderation" && (
        <div className={s.panel}>
          <div className={s.actions} style={{ marginBottom: "0.75rem" }}>
            <button type="button" className={s.btn} onClick={onBackfill}>
              Backfill legacy listings
            </button>
          </div>
          {pending.length === 0 ? (
            <div className={s.empty}>No pending listings</div>
          ) : (
            <div className={s.list}>
              {pending.map((l) => (
                <div key={l.id} className={s.row}>
                  <div className={s.info}>
                    <div className={s.name}>
                      <Link to={`/listing/${l.id}`}>{l.title}</Link>
                    </div>
                    <div className={s.meta}>
                      R{Number(l.price).toFixed(2)} ·{" "}
                      {l.sellerEmail || l.sellerId} · {l.subcategory}
                    </div>
                    <input
                      className={s.input}
                      style={{ marginTop: "0.5rem" }}
                      placeholder="Rejection reason (optional)"
                      value={rejectReasons[l.id] || ""}
                      onChange={(e) =>
                        setRejectReasons((prev) => ({
                          ...prev,
                          [l.id]: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className={s.actions}>
                    <button
                      type="button"
                      className={`${s.btn} ${s.btnSuccess}`}
                      onClick={() => onApprove(l.id)}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className={`${s.btn} ${s.btnDanger}`}
                      onClick={() => onReject(l.id)}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && tab === "orders" && (
        <div className={s.panel}>
          {orders.length === 0 ? (
            <div className={s.empty}>No orders</div>
          ) : (
            <div className={s.list}>
              {orders.map((o) => (
                <div key={o.id} className={s.row}>
                  <div className={s.info}>
                    <div className={s.name}>{o.listingTitle || o.id}</div>
                    <div className={s.meta}>
                      {o.status} · R{Number(o.price || 0).toFixed(2)} · buyer{" "}
                      {o.buyerEmail || o.buyerId?.slice(0, 8)}
                    </div>
                  </div>
                  <div className={s.actions}>
                    {o.status === "confirmed" && !o.paymentReleased && (
                      <button
                        type="button"
                        className={`${s.btn} ${s.btnPrimary}`}
                        onClick={() => onRelease(o.id)}
                      >
                        Release payment
                      </button>
                    )}
                    <select
                      className={s.select}
                      value={o.status}
                      onChange={(e) => onOrderStatus(o.id, e.target.value)}
                    >
                      {[
                        "pending_seller",
                        "accepted",
                        "declined",
                        "fulfilled",
                        "confirmed",
                        "disputed",
                        "completed",
                        "cancelled",
                      ].map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && tab === "users" && (
        <div className={s.panel}>
          <div className={s.list}>
            {users.map((u) => (
              <div key={u.uid} className={s.row}>
                <div className={s.info}>
                  <div className={s.name}>{u.email || u.uid}</div>
                  <div className={s.meta}>
                    role: {u.role || "user"} · verified (manual):{" "}
                    {u.verified ? "yes" : "no"} · student:{" "}
                    {u.studentVerificationStatus || "unverified"}
                  </div>
                </div>
                <div className={s.actions}>
                  <button
                    type="button"
                    className={s.btn}
                    onClick={() => onVerify(u.uid, !u.verified)}
                  >
                    {u.verified ? "Unverify" : "Verify"}
                  </button>
                  <select
                    className={s.select}
                    value={u.role || "user"}
                    onChange={(e) => onRole(u.uid, e.target.value)}
                  >
                    <option value="user">user</option>
                    <option value="vendor">vendor</option>
                    <option value="viewer">viewer</option>
                    <option value="admin">admin</option>
                  </select>
                  <button
                    type="button"
                    className={s.btn}
                    onClick={() => onMessageUser(u)}
                  >
                    Message
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "verification" && (
        <div className={s.panel}>
          <div className={s.actions} style={{ marginBottom: "0.75rem" }}>
            <button
              type="button"
              className={s.btn}
              onClick={onBackfillStudents}
              disabled={backfillBusy}
            >
              {backfillBusy ? "Backfilling…" : "Backfill .ac.za emails"}
            </button>
            <button
              type="button"
              className={s.btn}
              onClick={loadVerifications}
              disabled={verificationsLoading}
            >
              Refresh
            </button>
          </div>
          <p className={s.meta} style={{ marginBottom: "0.75rem" }}>
            Images are deleted automatically 30 days after submission (scheduled
            Cloud Function).
          </p>
          {verificationsLoading ? (
            <div className={s.loading}>
              <div className={s.spinner} />
            </div>
          ) : verifications.length === 0 ? (
            <div className={s.empty}>No pending verification requests</div>
          ) : (
            <div className={s.list}>
              {verifications.map((v) => {
                const submittedUser = users.find((u) => u.uid === v.uid);
                return (
                  <div
                    key={v.uid}
                    className={s.row}
                    style={{ alignItems: "center" }}
                  >
                    <div
                      className={s.info}
                      style={{
                        display: "flex",
                        gap: "0.75rem",
                        alignItems: "center",
                      }}
                    >
                      {v.cardImageUrl && (
                        <img
                          src={v.cardImageUrl}
                          alt="Student card"
                          style={{
                            width: "5rem",
                            height: "3.2rem",
                            objectFit: "cover",
                            borderRadius: "var(--radius-md)",
                            border: "1px solid var(--border-color)",
                          }}
                        />
                      )}
                      <div>
                        <div className={s.name}>
                          {submittedUser?.email || v.uid}
                        </div>
                        <div className={s.meta}>
                          Submitted:{" "}
                          {v.submittedAt?.toDate
                            ? v.submittedAt.toDate().toLocaleDateString()
                            : "—"}
                        </div>
                      </div>
                    </div>
                    <div className={s.actions}>
                      <button
                        type="button"
                        className={`${s.btn} ${s.btnSuccess}`}
                        onClick={() => onReviewVerification(v.uid, true)}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className={`${s.btn} ${s.btnDanger}`}
                        onClick={() => onReviewVerification(v.uid, false)}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "analytics" && (
        <div id="analytics-print-root">
          <div
            className={`${s.actions} no-print`}
            style={{ marginBottom: "1rem" }}
          >
            <button type="button" className={s.btn} onClick={onExportMarkdown}>
              Export .md
            </button>
            <button type="button" className={s.btn} onClick={onExportPdf}>
              Export PDF (print)
            </button>
          </div>

          {analyticsLoading && (
            <div className={s.loading}>
              <div className={s.spinner} />
            </div>
          )}

          {!analyticsLoading && (
            <>
              <div className={s.statGrid}>
                <div className={s.statCard}>
                  <div className={s.statLabel}>Marketplace GMV (paid)</div>
                  <div className={s.statValue}>R{analytics.gmv.toFixed(2)}</div>
                  <div className={s.statSub}>
                    {analytics.paidOrderCount} paid orders
                  </div>
                </div>
                <div className={s.statCard}>
                  <div className={s.statLabel}>Orders this week</div>
                  <div className={s.statValue}>{analytics.ordersThisWeek}</div>
                  <div className={s.statSub}>
                    {analytics.completedCount} completed ·{" "}
                    {analytics.disputedCount} disputed
                  </div>
                </div>
                <div className={s.statCard}>
                  <div className={s.statLabel}>StudX Pro MRR</div>
                  <div className={s.statValue}>R{analytics.mrr}</div>
                  <div className={s.statSub}>
                    {analytics.activeProSubs} active subscribers
                  </div>
                </div>
                <div className={s.statCard}>
                  <div className={s.statLabel}>Awaiting payment</div>
                  <div className={s.statValue}>{analytics.awaitingCount}</div>
                  <div className={s.statSub}>carts started, not yet paid</div>
                </div>
                <div className={s.statCard}>
                  <div className={s.statLabel}>Total users</div>
                  <div className={s.statValue}>{analytics.totalUsers}</div>
                  <div className={s.statSub}>
                    +{analytics.usersThisWeek} this week · +
                    {analytics.usersThisMonth} this month
                  </div>
                </div>
                <div className={s.statCard}>
                  <div className={s.statLabel}>Listings</div>
                  <div className={s.statValue}>{analytics.approvedCount}</div>
                  <div className={s.statSub}>
                    {analytics.pendingCount} pending · {analytics.rejectedCount}{" "}
                    rejected
                  </div>
                </div>
                <div className={s.statCard}>
                  <div className={s.statLabel}>Ad CTR</div>
                  <div className={s.statValue}>{analytics.ctr}%</div>
                  <div className={s.statSub}>
                    {analytics.totalClicks} clicks /{" "}
                    {analytics.totalImpressions} impressions
                  </div>
                </div>
              </div>

              <div className={s.panel}>
                <h3 className={s.panelTitle}>
                  Orders &amp; revenue — last 14 days
                </h3>
                <div style={{ width: "100%", height: 260 }}>
                  <ResponsiveContainer>
                    <LineChart data={analytics.dailyTrend}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border-color)"
                      />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="orders"
                        name="Orders"
                        stroke={CHART_COLORS[0]}
                        strokeWidth={2}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue (R)"
                        stroke={CHART_COLORS[1]}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className={s.chartRow}>
                <div className={s.panel}>
                  <h3 className={s.panelTitle}>Top sellers by revenue</h3>
                  {analytics.topSellers.length === 0 ? (
                    <div className={s.empty}>No paid orders yet</div>
                  ) : (
                    <div style={{ width: "100%", height: 240 }}>
                      <ResponsiveContainer>
                        <BarChart
                          data={analytics.topSellers}
                          layout="vertical"
                          margin={{ left: 40 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--border-color)"
                          />
                          <XAxis type="number" tick={{ fontSize: 11 }} />
                          <YAxis
                            type="category"
                            dataKey="email"
                            tick={{ fontSize: 10 }}
                            width={110}
                          />
                          <Tooltip
                            formatter={(v) => `R${Number(v).toFixed(2)}`}
                          />
                          <Bar
                            dataKey="revenue"
                            fill={CHART_COLORS[0]}
                            radius={[0, 4, 4, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className={s.panel}>
                  <h3 className={s.panelTitle}>Listing status breakdown</h3>
                  {analytics.listingStatusPie.length === 0 ? (
                    <div className={s.empty}>No listings yet</div>
                  ) : (
                    <div style={{ width: "100%", height: 240 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={analytics.listingStatusPie}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label
                          >
                            {analytics.listingStatusPie.map((entry, i) => (
                              <Cell
                                key={entry.name}
                                fill={CHART_COLORS[i % CHART_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              <div className={s.panel}>
                <h3 className={s.panelTitle}>Top sellers — detail</h3>
                {analytics.topSellers.length === 0 ? (
                  <div className={s.empty}>No paid orders yet</div>
                ) : (
                  <div className={s.list}>
                    {analytics.topSellers.map((seller) => (
                      <div key={seller.sellerId} className={s.row}>
                        <div className={s.info}>
                          <div className={s.name}>{seller.email}</div>
                          <div className={s.meta}>
                            {seller.orderCount} paid orders
                          </div>
                        </div>
                        <div className={s.name}>
                          R{seller.revenue.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={s.panel}>
                <h3 className={s.panelTitle}>StudX Eats</h3>
                <p className={s.meta} style={{ marginBottom: "0.75rem" }}>
                  No revenue figures — Eats has no in-app payment yet, buyers
                  pay vendors directly.
                </p>
                <div className={s.statGrid}>
                  <div className={s.statCard}>
                    <div className={s.statLabel}>Active vendors</div>
                    <div className={s.statValue}>{analytics.activeVendors}</div>
                    <div className={s.statSub}>
                      {analytics.vendorCount} total
                    </div>
                  </div>
                  <div className={s.statCard}>
                    <div className={s.statLabel}>Food orders</div>
                    <div className={s.statValue}>
                      {analytics.foodOrderCount}
                    </div>
                    <div className={s.statSub}>
                      {analytics.foodOrdersThisWeek} this week
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {!loading && tab === "ads" && (
        <>
          <div className={s.panel}>
            <h3 className={s.panelTitle}>Create ad</h3>
            <form className={`${s.form} ${s.form2}`} onSubmit={onCreateAd}>
              <div className={s.field}>
                <label className={s.label}>Title</label>
                <input
                  className={s.input}
                  required
                  value={adForm.title}
                  onChange={(e) =>
                    setAdForm({ ...adForm, title: e.target.value })
                  }
                />
              </div>
              <div className={s.field}>
                <label className={s.label}>Link URL</label>
                <input
                  className={s.input}
                  value={adForm.linkUrl}
                  onChange={(e) =>
                    setAdForm({ ...adForm, linkUrl: e.target.value })
                  }
                />
              </div>
              <div className={s.field}>
                <label className={s.label}>Image URL</label>
                <input
                  className={s.input}
                  value={adForm.imageUrl}
                  onChange={(e) =>
                    setAdForm({ ...adForm, imageUrl: e.target.value })
                  }
                />
              </div>
              <div className={s.field}>
                <label className={s.label}>CTA label</label>
                <input
                  className={s.input}
                  value={adForm.ctaLabel}
                  onChange={(e) =>
                    setAdForm({ ...adForm, ctaLabel: e.target.value })
                  }
                />
              </div>
              <label className={s.check}>
                <input
                  type="checkbox"
                  checked={adForm.active}
                  onChange={(e) =>
                    setAdForm({ ...adForm, active: e.target.checked })
                  }
                />
                Active
              </label>
              <button type="submit" className={`${s.btn} ${s.btnPrimary}`}>
                Create
              </button>
            </form>
          </div>
          <div className={s.panel}>
            <h3 className={s.panelTitle}>All ads</h3>
            {ads.length === 0 ? (
              <div className={s.empty}>No ads</div>
            ) : (
              <div className={s.list}>
                {ads.map((ad) => (
                  <div key={ad.id} className={s.row}>
                    <div className={s.info}>
                      <div className={s.name}>{ad.title}</div>
                      <div className={s.meta}>
                        {ad.active ? "active" : "off"} · clicks{" "}
                        {ad.clickCount || 0} · impressions{" "}
                        {ad.impressionCount || 0}
                      </div>
                    </div>
                    <div className={s.actions}>
                      <button
                        type="button"
                        className={s.btn}
                        onClick={() => toggleAd(ad.id, !ad.active).then(load)}
                      >
                        {ad.active ? "Disable" : "Enable"}
                      </button>
                      <button
                        type="button"
                        className={`${s.btn} ${s.btnDanger}`}
                        onClick={() => deleteAd(ad.id).then(load)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {!loading && tab === "promoted" && (
        <div className={s.panel}>
          <h3 className={s.panelTitle}>
            Homepage promoted listing (pinned slot)
          </h3>
          <p className={s.meta} style={{ marginBottom: "0.75rem" }}>
            This pins one listing as the first slide in the promoted carousel.
            Pro sellers' listings rotate in automatically during their promo
            week — this doesn't need to be touched for that to work.
          </p>
          <div className={s.field} style={{ marginBottom: "0.75rem" }}>
            <label className={s.label}>Listing</label>
            <select
              className={s.select}
              value={promotedId}
              onChange={(e) => setPromotedId(e.target.value)}
            >
              <option value="">None</option>
              {listings
                .filter((l) => l.moderationStatus !== "rejected")
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))}
            </select>
          </div>
          <button
            type="button"
            className={`${s.btn} ${s.btnPrimary}`}
            onClick={onSavePromoted}
          >
            Save promoted
          </button>

          <h3 className={s.panelTitle} style={{ marginTop: "1.5rem" }}>
            Featured flags (legacy manual toggle)
          </h3>
          <div className={s.list}>
            {listings.slice(0, 40).map((l) => (
              <div key={l.id} className={s.row}>
                <div className={s.info}>
                  <div className={s.name}>{l.title}</div>
                  <div className={s.meta}>
                    {l.featured ? "featured" : "normal"}
                  </div>
                </div>
                <button
                  type="button"
                  className={s.btn}
                  onClick={() => onFeature(l.id, !l.featured)}
                >
                  {l.featured ? "Unfeature" : "Feature"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && tab === "settings" && (
        <>
          <div className={s.panel}>
            <h3 className={s.panelTitle}>Chat TTL</h3>
            <div
              className={s.field}
              style={{ maxWidth: "12rem", marginBottom: "0.75rem" }}
            >
              <label className={s.label}>Days until chats expire</label>
              <input
                className={s.input}
                type="number"
                min="1"
                value={ttlDays}
                onChange={(e) => setTtlDays(e.target.value)}
              />
            </div>
            <button
              type="button"
              className={`${s.btn} ${s.btnPrimary}`}
              onClick={onSaveChat}
            >
              Save settings
            </button>
          </div>

          <div className={s.panel}>
            <h3 className={s.panelTitle}>Marketplace commission</h3>
            <p className={s.meta} style={{ marginBottom: "0.75rem" }}>
              OFF by default — everyone pays 0%. Turning this on applies
              immediately to every NEW seller payout setup and every Pro
              subscribe/cancel event going forward. It does NOT retroactively
              change sellers who already have a subaccount at a different rate —
              resync those manually if needed.
            </p>
            <label className={s.check} style={{ marginBottom: "0.75rem" }}>
              <input
                type="checkbox"
                checked={commission.enabled}
                onChange={(e) =>
                  setCommission({ ...commission, enabled: e.target.checked })
                }
              />
              Commission is LIVE
            </label>
            <div
              className={`${s.form} ${s.form2}`}
              style={{ marginBottom: "0.75rem" }}
            >
              <div className={s.field}>
                <label className={s.label}>
                  Base rate (%) — non-Pro sellers
                </label>
                <input
                  className={s.input}
                  type="number"
                  min="0"
                  max="100"
                  value={commission.baseRate}
                  onChange={(e) =>
                    setCommission({ ...commission, baseRate: e.target.value })
                  }
                />
              </div>
              <div className={s.field}>
                <label className={s.label}>
                  Pro rate (%) — active StudX Pro sellers
                </label>
                <input
                  className={s.input}
                  type="number"
                  min="0"
                  max="100"
                  value={commission.proRate}
                  onChange={(e) =>
                    setCommission({ ...commission, proRate: e.target.value })
                  }
                />
              </div>
            </div>
            <button
              type="button"
              className={`${s.btn} ${s.btnPrimary}`}
              onClick={onSaveCommission}
              disabled={commissionBusy}
            >
              {commissionBusy ? "Saving…" : "Save commission settings"}
            </button>
          </div>
        </>
      )}
    </AdminShell>
  );
}
