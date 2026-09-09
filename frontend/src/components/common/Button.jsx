export default function Button({ children, variant = "primary", ...props }) {
  const base = "px-6 py-3 rounded-lg font-semibold transition-colors";
  const variants = {
    primary: "bg-brand-red text-white hover:bg-red-700",
    outline: "border border-brand-navy text-brand-navy hover:bg-brand-navy hover:text-white",
  };
  return (
    <button className={`${base} ${variants[variant]}`} {...props}>
      {children}
    </button>
  );
}