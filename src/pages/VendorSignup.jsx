import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { becomeVendor } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { useViewer } from "../context/ViewerContext";
import s from "../styles/Dashboard.module.css";

export default function VendorSignup() {
  const { currentUser } = useAuth();
  const { guardViewer } = useViewer();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cuisineType, setCuisineType] = useState("");
  const [location, setLocation] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (guardViewer()) return;
    if (!name.trim()) {
      setError("Kitchen/business name is required.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await becomeVendor(currentUser.uid, {
        name: name.trim(),
        description,
        cuisineType,
        location,
        contactNumber,
      });
      navigate("/eats/vendor");
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not complete vendor signup");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={s.page}>
      <header className={s.header}>
        <h1 className={s.title}>Become a StudX Eats vendor</h1>
        <p className={s.sub}>
          Set up your kitchen/stall to start taking food orders from students.
        </p>
      </header>

      {error && (
        <div
          className={s.empty}
          style={{ marginBottom: "1rem", color: "var(--danger-text)" }}
        >
          {error}
        </div>
      )}

      <form
        onSubmit={submit}
        className={s.card}
        style={{
          flexDirection: "column",
          alignItems: "stretch",
          display: "flex",
          gap: "0.75rem",
        }}
      >
        <input
          placeholder="Kitchen / business name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{
            padding: "0.6rem 0.75rem",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            background: "var(--bg-input)",
            color: "var(--text-primary)",
          }}
        />
        <textarea
          placeholder="Short description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{
            padding: "0.6rem 0.75rem",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            background: "var(--bg-input)",
            color: "var(--text-primary)",
            minHeight: "4rem",
          }}
        />
        <input
          placeholder="Cuisine type, e.g. Home-style meals"
          value={cuisineType}
          onChange={(e) => setCuisineType(e.target.value)}
          style={{
            padding: "0.6rem 0.75rem",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            background: "var(--bg-input)",
            color: "var(--text-primary)",
          }}
        />
        <input
          placeholder="Location on campus"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          style={{
            padding: "0.6rem 0.75rem",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            background: "var(--bg-input)",
            color: "var(--text-primary)",
          }}
        />
        <input
          placeholder="Contact number"
          value={contactNumber}
          onChange={(e) => setContactNumber(e.target.value)}
          style={{
            padding: "0.6rem 0.75rem",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            background: "var(--bg-input)",
            color: "var(--text-primary)",
          }}
        />
        <button
          type="submit"
          className={`${s.btn} ${s.btnPrimary}`}
          disabled={busy}
          style={{ alignSelf: "flex-start" }}
        >
          {busy ? "Setting up…" : "Become a vendor"}
        </button>
      </form>
    </div>
  );
}
