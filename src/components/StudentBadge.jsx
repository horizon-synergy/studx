export default function StudentBadge({ status, size = "sm" }) {
  if (status !== "verified") return null;
  const px = size === "sm" ? "0.65rem" : "0.75rem";
  return (
    <span
      title="Verified via university email"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        fontSize: px,
        fontWeight: 700,
        color: "#16a34a",
        background: "rgba(34, 197, 94, 0.1)",
        border: "1px solid rgba(34, 197, 94, 0.3)",
        borderRadius: "var(--radius-full, 9999px)",
        padding: "0.15rem 0.5rem",
        lineHeight: 1.4,
      }}
    >
      ✓ Verified Student
    </span>
  );
}
