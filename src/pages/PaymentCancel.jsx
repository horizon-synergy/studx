import { Link } from "react-router-dom";
import s from "../styles/Auth.module.css";

export default function PaymentCancel() {
  return (
    <div className={s.page}>
      <div className={s.card}>
        <div className={s.brand}>
          <div className={s.logo}>SX</div>
          <h1 className={s.title}>Payment cancelled</h1>
          <p className={s.sub}>
            No charge was made. You can return to checkout and try again.
          </p>
        </div>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <Link
            to="/checkout"
            className={s.submit}
            style={{ textAlign: "center", textDecoration: "none" }}
          >
            Back to checkout
          </Link>
          <Link to="/" className={s.google} style={{ textDecoration: "none" }}>
            Keep browsing
          </Link>
        </div>
      </div>
    </div>
  );
}
