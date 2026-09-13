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
        fontWeight: 800,
        color: "#15803d",
        background: "#f0fdf4",
        border: "1.5px solid var(--brut-border-color, #141310)",
        borderRadius: "4px",
        padding: "0.15rem 0.5rem",
        lineHeight: 1.4,
      }}
    >
      ✓ Verified Student
    </span>
  );
}
