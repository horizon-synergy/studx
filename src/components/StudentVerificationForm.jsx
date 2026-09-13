import { useEffect, useState } from "react";
import { uploadImageToCloudinary } from "../utils/cloudinary";
import {
  submitStudentVerification,
  getMyStudentVerification,
} from "../services/firebase";
import { useAuth } from "../context/AuthContext";

export default function StudentVerificationForm() {
  const { currentUser } = useAuth();
  const [status, setStatus] = useState(null);
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentUser) return;
    getMyStudentVerification(currentUser.uid).then(setStatus);
  }, [currentUser?.uid]);

  const submit = async () => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const url = await uploadImageToCloudinary(file, setProgress);
      await submitStudentVerification(currentUser.uid, url);
      setStatus({ status: "pending" });
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  if (status?.status === "approved")
    return (
      <p style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", fontWeight: 800, color: "#15803d", background: "#f0fdf4", border: "1.5px solid var(--brut-border-color, #141310)", borderRadius: "4px", padding: "0.3rem 0.6rem", width: "fit-content" }}>
        ✓ Verified student.
      </p>
    );
  if (status?.status === "pending")
    return (
      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", background: "var(--neu-bg, #f5f4f0)", padding: "0.75rem 0.9rem", borderRadius: "var(--neu-radius-sm, 10px)", boxShadow: "inset 3px 3px 6px var(--neu-dark, #d6d2c8), inset -3px -3px 6px var(--neu-light, #fff)" }}>
        Your student card is under review — usually within a couple of days.
      </p>
    );

  return (
    <div>
      <p
        style={{
          fontSize: "0.8rem",
          color: "var(--text-muted)",
          marginBottom: "0.75rem",
        }}
      >
        Upload a photo of your student card. Reviewed manually, then deleted —
        we don't keep it longer than 30 days. Questions or deletion requests:
        studxsupport@gmail.com.
      </p>
      {status?.status === "rejected" && (
        <p style={{ color: "var(--danger-text)", fontWeight: 600, fontSize: "0.8rem", marginBottom: "0.5rem" }}>
          Previous submission wasn't approved — try again with a clearer photo.
        </p>
      )}
      {error && <p style={{ color: "var(--danger-text)", fontWeight: 600, fontSize: "0.8rem", marginBottom: "0.5rem" }}>{error}</p>}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        style={{
          display: "block",
          width: "100%",
          padding: "0.6rem 0.8rem",
          background: "var(--neu-bg, #f5f4f0)",
          border: "none",
          borderRadius: "var(--neu-radius-sm, 10px)",
          fontSize: "0.8rem",
          color: "var(--text-primary)",
          boxShadow: "inset 3px 3px 6px var(--neu-dark, #d6d2c8), inset -3px -3px 6px var(--neu-light, #fff)",
          marginBottom: "0.65rem",
        }}
      />
      {busy && <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Uploading… {progress}%</p>}
      <button
        type="button"
        onClick={submit}
        disabled={!file || busy}
        style={{
          padding: "0.65rem 1.2rem",
          background: "var(--brand-blue)",
          color: "#fff",
          border: "2.5px solid var(--brut-border-color, #141310)",
          borderRadius: "var(--brut-radius-sm, 6px)",
          fontWeight: 800,
          fontSize: "0.85rem",
          cursor: !file || busy ? "not-allowed" : "pointer",
          opacity: !file || busy ? 0.55 : 1,
          boxShadow: !file || busy ? "none" : "4px 4px 0 var(--brut-border-color, #141310)",
        }}
      >
        Submit for review
      </button>
    </div>
  );
}
