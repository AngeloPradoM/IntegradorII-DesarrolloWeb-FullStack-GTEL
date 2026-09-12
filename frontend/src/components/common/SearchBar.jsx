
export default function SearchBar({ onSearch }) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl shadow-sm p-4">
      <span className="text-brand-gray">🔍</span>
      <input
        type="text"
        placeholder="Buscar oferta laboral..."
        className="flex-1 outline-none text-brand-navy"
        onChange={(e) => onSearch?.(e.target.value)}
      />
      <button className="border border-brand-navy text-brand-navy rounded-lg px-4 py-2 font-medium hover:bg-brand-navy hover:text-white transition-colors">
        Filtros
      </button>
    </div>
  );
}