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

  if (status?.status === "approved") return <p>✓ Verified student.</p>;
  if (status?.status === "pending")
    return (
      <p>
        Your student card is under review — usually within a couple of days.
      </p>
    );

  return (
    <div>
      <p
        style={{
          fontSize: "0.8rem",
          color: "var(--text-muted)",
          marginBottom: "0.5rem",
        }}
      >
        Upload a photo of your student card. Reviewed manually, then deleted —
        we don't keep it longer than 30 days. Questions or deletion requests:
        studxsupport@gmail.com.
      </p>
      {status?.status === "rejected" && (
        <p style={{ color: "var(--danger-text)" }}>
          Previous submission wasn't approved — try again with a clearer photo.
        </p>
      )}
      {error && <p style={{ color: "var(--danger-text)" }}>{error}</p>}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      {busy && <p>Uploading… {progress}%</p>}
      <button type="button" onClick={submit} disabled={!file || busy}>
        Submit for review
      </button>
    </div>
  );
}
