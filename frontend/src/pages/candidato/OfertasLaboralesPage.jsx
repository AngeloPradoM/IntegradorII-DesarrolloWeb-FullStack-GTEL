import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import AuthRequiredLink from "../../components/auth/AuthRequiredLink";
import { Search, MapPin, Clock, DollarSign, Bookmark, BookmarkCheck, Filter, ChevronDown, Briefcase, X, Zap, RefreshCw, AlertCircle } from "lucide-react";
import { getPublicJobs } from "../../services/jobService";
import { useAuth } from "../../context/AuthContext";

export default function JobListings() {
  const { user } = useAuth();
  const isAdminPreview = user?.rol === 'ADMIN';
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPublicJobs();
      setJobs(data.map(job => ({
        ...job,
        tags: Array.isArray(job.tags) ? job.tags : [],
        description: job.description || job.descripcion || "",
        posted: job.posted || "Disponible"
      })));
    } catch (err) {
      setError(err.message || "No se pudieron cargar las ofertas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const toggleSave = id => {
    setSaved(prev => {
      const next = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      try {
        localStorage.setItem("gtel-saved-jobs", JSON.stringify(next));
      } catch {
        // Ignorar si storage no está disponible
      }
      return next;
    });
  };

  const filtered = jobs.filter(j => {
    const matchSearch =
      (j.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (j.department || "").toLowerCase().includes(search.toLowerCase()) ||
      (j.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchType = typeFilter === "all" || j.type === typeFilter;
    const matchLoc = locationFilter === "all" || (j.location || "").toLowerCase().includes(locationFilter.toLowerCase());
    return matchSearch && matchType && matchLoc;
  });

  const salaryVal = job => Number(String(job.salary || "").match(/[\d,]+/)?.[0]?.replaceAll(",", "") || 0);
  if (sortBy === "salary-high") filtered.sort((a, b) => salaryVal(b) - salaryVal(a));
  if (sortBy === "salary-low") filtered.sort((a, b) => salaryVal(a) - salaryVal(b));

  return (
    <div className="min-h-screen bg-app-bg text-app-primary">
      {/* Search hero */}
      <div className="bg-brand-navy px-4 py-10 dark:bg-app-surface">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-2 text-center">{isAdminPreview ? 'Supervisión de ofertas' : 'Encuentra tu próximo empleo en GTEL'}</h1>
          <p className="text-white/60 text-sm text-center mb-6">
            {loading ? "Cargando oportunidades…" : isAdminPreview ? `${jobs.length} convocatorias visibles en la vista pública` : `${jobs.length} oportunidades disponibles hoy`}
          </p>
          <div className="flex gap-3 flex-col sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-app-secondary" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                type="text"
                placeholder="Puesto, área, habilidad..."
                className="w-full rounded-lg border border-app-border bg-app-surface py-3 pl-10 pr-10 text-sm text-app-primary shadow-sm outline-none placeholder:text-app-secondary focus:border-app-action focus:ring-2 focus:ring-app-action/25"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  type="button"
                  aria-label="Limpiar búsqueda"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded text-app-secondary hover:text-app-accent"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="button"
              aria-expanded={filterOpen}
              onClick={() => setFilterOpen(!filterOpen)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                filterOpen ? "bg-app-action text-white" : "border border-app-border bg-app-surface text-app-primary hover:bg-app-muted"
              }`}
            >
              <Filter className="w-4 h-4" />
              Filtros
              <ChevronDown className={`w-4 h-4 transition-transform ${filterOpen ? "rotate-180" : ""}`} />
            </button>
          </div>

          {/* Filter panel */}
          {filterOpen && (
            <div className="mt-3 rounded-xl border border-app-border bg-app-surface p-4 shadow-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="mb-2 block text-xs font-semibold text-app-primary">Tipo de jornada</span>
                  <div className="flex gap-2 flex-wrap">
                    {["all", "Full-Time", "Part-Time", "Por turnos", "Freelance"].map(t => (
                      <button
                        type="button"
                        key={t}
                        aria-pressed={typeFilter === t}
                        onClick={() => setTypeFilter(t)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          typeFilter === t
                            ? "border-app-action bg-app-action text-white"
                            : "border-app-border text-app-body hover:border-app-accent hover:text-app-accent"
                        }`}
                      >
                        {t === "all" ? "Todos" : t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold text-app-primary" htmlFor="job-location-filter">Ubicación</label>
                  <select
                    id="job-location-filter"
                    value={locationFilter}
                    onChange={e => setLocationFilter(e.target.value)}
                    className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-primary outline-none focus:border-app-action focus:ring-2 focus:ring-app-action/20"
                  >
                    <option value="all">Todas las ubicaciones</option>
                    {[...new Set(jobs.map(job => job.location).filter(Boolean))].map(location => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-between mb-5">
          <div className="text-sm text-app-secondary">
            <span className="font-semibold text-app-primary">{filtered.length}</span> resultados encontrados
          </div>
          <div className="flex items-center gap-2 text-xs text-app-secondary">
            <span>Ordenar por:</span>
            <select
              aria-label="Ordenar ofertas"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="rounded-lg border border-app-border bg-app-surface px-2 py-1 text-xs text-app-primary outline-none focus:border-app-action focus:ring-2 focus:ring-app-action/20"
            >
              <option value="recent">Más recientes</option>
              <option value="salary-high">Mejor remuneración</option>
              <option value="salary-low">Menor remuneración</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 py-20 text-center text-app-secondary">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-app-accent" />
            <p className="text-sm font-medium">Cargando convocatorias laborales activas…</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
            <p className="font-semibold">{error}</p>
            <button
              onClick={loadJobs}
              className="mt-4 rounded-lg bg-app-action px-4 py-2 text-xs font-semibold text-white hover:bg-app-action-hover"
            >
              Reintentar
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-app-secondary">
            <Briefcase className="mx-auto mb-3 h-10 w-10 text-app-border-strong" />
            <p className="font-medium">No se encontraron resultados</p>
            <p className="text-sm mt-1">Intenta con otros términos de búsqueda o filtros.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(job => (
              <div
                key={job.id}
                className="group flex flex-col rounded-xl border border-app-border bg-app-surface shadow-sm transition-all hover:-translate-y-0.5 hover:border-app-border-strong hover:shadow-md"
              >
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                            job.type === "Full-Time"
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-200"
                              : "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-200"
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          {job.type}
                        </span>
                        {job.modality && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-app-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-app-body">
                            {job.modality}
                          </span>
                        )}
                        {job.status === "activa" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-app-danger-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-app-accent">
                            <Zap className="w-3 h-3" />
                            CONVOCATORIA
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold leading-tight text-app-primary transition-colors group-hover:text-app-accent">
                        <Link to={`/ofertas/${job.id}`}>{job.title}</Link>
                      </h3>
                    </div>
                    <button
                      aria-label={saved.includes(job.id) ? "Quitar de favoritos" : "Guardar oferta"}
                      aria-pressed={saved.includes(job.id)}
                      onClick={() => toggleSave(job.id)}
                      className={`ml-2 flex-shrink-0 p-1.5 rounded-lg transition-colors ${
                        saved.includes(job.id)
                          ? "bg-app-danger-soft text-app-accent"
                          : "text-app-secondary hover:bg-app-danger-soft hover:text-app-accent"
                      }`}
                    >
                      {saved.includes(job.id) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>
                  </div>

                  <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-app-body">{job.description}</p>

                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-1.5 text-xs text-app-body">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-app-secondary" />
                      {job.location}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-app-body">
                      <DollarSign className="h-3.5 w-3.5 flex-shrink-0 text-app-secondary" />
                      {job.salary} mensual
                    </div>
                  </div>

                  {Array.isArray(job.tags) && job.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {job.tags.map(tag => (
                        <span key={tag} className="rounded-md border border-app-border bg-app-muted px-2 py-0.5 text-[10px] text-app-body">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-app-border px-5 pb-4 pt-3">
                  <span className="text-[10px] text-app-secondary">{job.posted}</span>
                  {isAdminPreview ? <Link to={`/ofertas/${job.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-app-border px-4 py-2 text-xs font-semibold text-app-primary transition-colors hover:bg-app-muted">Vista previa</Link> : <AuthRequiredLink
                    to={`/postular/${job.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-app-action px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-app-action-hover"
                  >Postular ahora</AuthRequiredLink>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
