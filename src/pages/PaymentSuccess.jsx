import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getCheckoutById } from "../services/firebase";
import s from "../styles/Auth.module.css";

const COPY = {
  marketplace: {
    title: "Payment received",
    paid: "Payment confirmed. Your order is with the seller.",
    pending:
      "Thanks — payment is processing. You\u2019ll get a notification when it\u2019s confirmed.",
    checking: "Confirming your payment…",
    backLabel: "Go to Dashboard",
    backTo: "/dashboard",
  },
  pro_subscription: {
    title: "Welcome to StudX Pro",
    paid: "Your subscription is active. Seller analytics, StudX+ on every listing, and your promoted week are live.",
    pending: "Thanks — confirming your subscription now.",
    checking: "Confirming your subscription…",
    backLabel: "Go to Dashboard",
    backTo: "/dashboard",
  },
  featured_listing: {
    title: "StudX+ activated",
    paid: "Your listing is featured for the next 30 days.",
    pending: "Thanks — activating StudX+ on your listing now.",
    checking: "Activating StudX+…",
    backLabel: "Go to Dashboard",
    backTo: "/dashboard",
  },
};

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const kind = params.get("kind") || "marketplace";
  const checkoutId = params.get("checkoutId");
  const [status, setStatus] = useState("checking");
  const copy = COPY[kind] || COPY.marketplace;

  useEffect(() => {
    // Only marketplace checkouts create a Firestore checkout doc we can poll.
    // pro_subscription / featured_listing are direct Paystack transactions
    // with no checkoutId — the webhook updates proSubscriptions/listings
    // directly, so there's nothing to poll here; just show a confirmation.
    if (kind !== "marketplace" || !checkoutId) {
      setStatus("ok");
      return;
    }
    let alive = true;
    let tries = 0;
    const poll = async () => {
      try {
        const data = await getCheckoutById(checkoutId);
        if (!alive) return;
        if (data?.status === "paid" || data?.paymentStatus === "paid") {
          setStatus("paid");
          return;
        }
        tries += 1;
        if (tries < 8) setTimeout(poll, 1500);
        else setStatus("pending");
      } catch {
        if (alive) setStatus("pending");
      }
    };
    poll();
    return () => {
      alive = false;
    };
  }, [checkoutId, kind]);

  return (
    <div className={s.page}>
      <div className={s.card}>
        <div className={s.brand}>
          <div className={s.logo}>SX</div>
          <h1 className={s.title}>{copy.title}</h1>
          <p className={s.sub}>
            {status === "paid" && copy.paid}
            {status === "pending" && copy.pending}
            {status === "checking" && copy.checking}
            {status === "ok" && copy.paid}
          </p>
        </div>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <Link
            to={copy.backTo}
            className={s.submit}
            style={{ textAlign: "center", textDecoration: "none" }}
          >
            {copy.backLabel}
          </Link>
          <Link to="/" className={s.google} style={{ textDecoration: "none" }}>
            Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}
