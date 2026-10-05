import useJobs from "../../hooks/useJobs";
import { useState } from "react";
import { Link } from "react-router-dom";
import AuthRequiredLink from "../../components/auth/AuthRequiredLink";
import { Search, MapPin, Clock, DollarSign, Bookmark, BookmarkCheck, Filter, ChevronDown, Briefcase, X, Zap } from "lucide-react";
export default function JobListings() {
  const {jobs,loading,error}=useJobs();
  const [sortBy, setSortBy] = useState("recent");
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("gtel-saved-jobs") || "[]");
    } catch {
      return [];
    }
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const toggleSave = id => {
    setSaved(prev => {
      const next = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      localStorage.setItem("gtel-saved-jobs", JSON.stringify(next));
      return next;
    });
  };
  const filtered = jobs.filter(j => {
    const matchSearch = j.title.toLowerCase().includes(search.toLowerCase()) || j.department.toLowerCase().includes(search.toLowerCase()) || j.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchType = typeFilter === "all" || j.type === typeFilter;
    const matchLoc = locationFilter === "all" || j.location.toLowerCase().includes(locationFilter.toLowerCase());
    return matchSearch && matchType && matchLoc;
  });
  const salary = job => Number(String(job.salary).match(/[\d,]+/)?.[0]?.replaceAll(",", "") || 0);
  if (sortBy === "salary-high") filtered.sort((a, b) => salary(b) - salary(a));
  if (sortBy === "salary-low") filtered.sort((a, b) => salary(a) - salary(b));
  return <div className="min-h-screen bg-[#F8FAFC]">
      {/* Search hero */}
      <div className="bg-[#1E293B] py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-2 text-center">Encuentra tu próximo empleo en GTEL</h1>
          <p className="text-white/60 text-sm text-center mb-6">{jobs.length} oportunidades disponibles hoy</p>
          <div className="flex gap-3 flex-col sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} type="text" placeholder="Puesto, área, habilidad..." className="w-full pl-10 pr-4 py-3 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 shadow-sm" />
              {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>}
            </div>
            <button onClick={() => setFilterOpen(!filterOpen)} className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${filterOpen ? "bg-[#D32F2F] text-white" : "bg-white text-[#1E293B] hover:bg-gray-50"}`}>
              <Filter className="w-4 h-4" />
              Filtros
              <ChevronDown className={`w-4 h-4 transition-transform ${filterOpen ? "rotate-180" : ""}`} />
            </button>
          </div>

          {/* Filter panel */}
          {filterOpen && <div className="mt-3 bg-white rounded-xl p-4 shadow-lg border border-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-2">Tipo de jornada</label>
                  <div className="flex gap-2 flex-wrap">
                    {["all", "Full-Time", "Part-Time"].map(t => <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${typeFilter === t ? "bg-[#D32F2F] text-white border-[#D32F2F]" : "border-gray-200 text-[#475569] hover:border-[#D32F2F] hover:text-[#D32F2F]"}`}>
                        {t === "all" ? "Todos" : t}
                      </button>)}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-2">Ubicación</label>
                  <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]">
                    <option value="all">Todas las ubicaciones</option>
                    {[...new Set(jobs.map(job => job.location))].map(location => <option key={location} value={location}>{location}</option>)}
                  </select>
                </div>
              </div>
            </div>}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-5">
          <div className="text-sm text-[#475569]">
            <span className="font-semibold text-[#1E293B]">{filtered.length}</span> resultados encontrados
          </div>
          <div className="flex items-center gap-2 text-xs text-[#475569]">
            <span>Ordenar por:</span>
            <select aria-label="Ordenar ofertas" value={sortBy} onChange={e => setSortBy(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#D32F2F]/30">
              <option value="recent">Más recientes</option>
              <option value="salary-high">Mejor remuneración</option>
              <option value="salary-low">Menor remuneración</option>
            </select>
          </div>
        </div>

        {error && <p role="alert">{error}</p>}{loading && <p role="status">Cargando ofertas…</p>}
        {filtered.length === 0 ? <div className="text-center py-16 text-[#475569]">
            <Briefcase className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No se encontraron resultados</p>
            <p className="text-sm mt-1">Intenta con otros términos de búsqueda</p>
          </div> : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(job => <div key={job.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group flex flex-col">
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${job.type === "Full-Time" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                          <Clock className="w-3 h-3" />
                          {job.type}
                        </span>
                        {job.isNew && <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide bg-[#D32F2F]/10 text-[#D32F2F]">
                            <Zap className="w-3 h-3" />
                            NUEVO
                          </span>}
                        {job.urgent && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 uppercase tracking-wide">
                            Urgente
                          </span>}
                      </div>
                      <h3 className="font-bold text-[#1E293B] text-sm leading-tight group-hover:text-[#D32F2F] transition-colors">
                        <Link to={`/ofertas/${job.id}`}>{job.title}</Link>
                      </h3>
                    </div>
                    <button aria-label={saved.includes(job.id) ? "Quitar de favoritos" : "Guardar oferta"} aria-pressed={saved.includes(job.id)} onClick={() => toggleSave(job.id)} className={`ml-2 flex-shrink-0 p-1.5 rounded-lg transition-colors ${saved.includes(job.id) ? "text-[#D32F2F] bg-[#D32F2F]/10" : "text-gray-400 hover:text-[#D32F2F] hover:bg-[#D32F2F]/10"}`}>
                      {saved.includes(job.id) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>
                  </div>

                  <p className="text-xs text-[#475569] leading-relaxed mb-3">{job.description}</p>

                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-1.5 text-xs text-[#475569]">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      {job.location}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#475569]">
                      <DollarSign className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      {job.salary} mensual
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {job.tags.map(tag => <span key={tag} className="text-[10px] bg-[#F8FAFC] border border-gray-200 text-[#475569] px-2 py-0.5 rounded-md">
                        {tag}
                      </span>)}
                  </div>
                </div>

                <div className="px-5 pb-4 flex items-center justify-between border-t border-gray-50 pt-3">
                  <span className="text-[10px] text-[#475569]">{job.posted}</span>
                  <AuthRequiredLink to={`/postulacion/${job.id}`} className="inline-flex items-center gap-1.5 bg-[#D32F2F] hover:bg-[#B71C1C] text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors">
                    Postular ahora
                  </AuthRequiredLink>
                </div>
              </div>)}
          </div>}
      </div>
    </div>;
}
