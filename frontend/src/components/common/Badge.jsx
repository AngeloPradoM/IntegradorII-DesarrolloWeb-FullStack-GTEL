export default function Badge({ children, color = "gray" }) {
  const colors = {
    gray: "bg-slate-100 text-brand-navy",
    red: "bg-red-100 text-brand-red",
    green: "bg-green-100 text-status-success",
    yellow: "bg-yellow-100 text-status-warning",
    blue: "bg-blue-100 text-status-info",
  };
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full ${colors[color] || colors.gray}`}>
      {children}
    </span>
  );
}
