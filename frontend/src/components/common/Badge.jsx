export default function Badge({ children, color = "gray" }) {
  const colors = {
    gray: "bg-slate-100 text-brand-navy",
    red: "bg-red-100 text-brand-red",
    green: "bg-green-100 text-green-700",
  };
  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${colors[color]}`}>
      {children}
    </span>
  );
}