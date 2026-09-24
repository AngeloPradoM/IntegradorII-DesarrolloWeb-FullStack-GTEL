export default function Button({ children, variant = "primary", className = "", type = "button", ...props }) {
  const base = "inline-flex min-h-11 items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60";
  const variants = {
    primary: "bg-brand-red text-white hover:bg-brand-red-hover",
    outline: "border border-slate-200 bg-white text-brand-navy hover:bg-slate-50",
  };
  return (
    <button type={type} className={`${base} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </button>
  );
}
