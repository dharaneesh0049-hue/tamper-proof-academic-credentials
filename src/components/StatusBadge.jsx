export default function StatusBadge({ value }) {
  const cls = String(value || "").toLowerCase().replaceAll("_", "-");
  return <span className={`status ${cls}`}>{String(value || "").replaceAll("_", " ")}</span>;
}
