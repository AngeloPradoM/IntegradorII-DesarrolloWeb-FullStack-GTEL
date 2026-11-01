import useRecruiterData from "../../hooks/useRecruiterData";
import DataState from "../../components/ui/DataState";
import { getRecruiterCandidates, updateCandidateStatus } from "../../services/api";
import CandidateKanbanBoard from "../../components/recruiter/CandidateKanbanBoard";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  Eye,
  Download,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Table as TableIcon,
  CheckCircle2,
  AlertCircle,
  X
} from "lucide-react";

const statusConfig = {
  new: {
    label: "Nuevo",
    color: "bg-blue-100 text-blue-700"
  },
  interview: {
    label: "Entrevista",
    color: "bg-purple-100 text-purple-700"
  },
  reviewing: {
    label: "En revisión",
    color: "bg-yellow-100 text-yellow-700"
  },
  approved: {
    label: "Aprobado",
    color: "bg-green-100 text-green-700"
  },
  rejected: {
    label: "Descartado",
    color: "bg-red-100 text-[#D32F2F]"
  }
};

const avatarColors = [
  "bg-[#D32F2F]", "bg-blue-600", "bg-green-600", "bg-purple-600",
  "bg-orange-600", "bg-teal-600", "bg-pink-600", "bg-indigo-600",
  "bg-cyan-600", "bg-amber-600"
];

/* ------------------------------------------------------------------ *
 * RFC-2026-0001 · Filtros avanzados de postulantes (SIMULADO)
 *
 * Por ahora el filtrado se hace en el cliente sobre los datos ya cargados.
 * Cuando el backend esté listo (migración 004 + parámetros de consulta),
 * basta con enviar `buildFilterQuery(filters)` a getRecruiterCandidates
 * y eliminar `applyAdvancedFilters`.
 * ------------------------------------------------------------------ */

// Convierte el valor de fecha del postulante a Date (acepta ISO, dd/mm/yyyy o Date.parse).
// TODO: si el API usa otro campo (p. ej. createdAt / appliedAt), ajustar aquí.
const parseCandidateDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value) ? null : value;
  const text = String(value).trim();
  const dmy = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dmy) return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
  const parsed = new Date(text);
  return isNaN(parsed) ? null : parsed;
};

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// Parámetros que se enviarían al backend cuando se integre.
const buildFilterQuery = ({ convocatoria, status, dateFrom, dateTo }) => {
  const query = {};
  if (convocatoria) query.convocatoria = convocatoria;
  if (status && status !== "all") query.estado = status;
  if (dateFrom) query.fechaDesde = dateFrom;
  if (dateTo) query.fechaHasta = dateTo;
  return query;
};

// Filtrado simulado en el cliente. Los filtros se combinan (AND).
const applyAdvancedFilters = (candidates, { convocatoria, status, dateFrom, dateTo }, dateRangeInvalid) => {
  const from = dateFrom && !dateRangeInvalid ? startOfDay(new Date(`${dateFrom}T00:00:00`)) : null;
  const to = dateTo && !dateRangeInvalid ? startOfDay(new Date(`${dateTo}T00:00:00`)) : null;

  return candidates.filter((c) => {
    if (convocatoria && (c.job || "") !== convocatoria) return false;
    if (status && status !== "all" && c.status !== status) return false;
    if (from || to) {
      const registered = parseCandidateDate(c.date);
      if (!registered) return false;
      const day = startOfDay(registered);
      if (from && day < from) return false;
      if (to && day > to) return false;
    }
    return true;
  });
};

const formatInputDate = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export default function CandidateDirectory() {
  const { data, loading, error, retry } = useRecruiterData(getRecruiterCandidates);
  const candidates = data || [];
  const [params, setParams] = useSearchParams();

  // Todos los filtros viven en la URL (se pueden compartir y sobreviven al recargar).
  const updateParam = (key, value) => setParams(previous => {
    const next = new URLSearchParams(previous);
    value ? next.set(key, value) : next.delete(key);
    return next;
  }, { replace: true });

  const search = params.get('q') || '';
  const convocatoria = params.get('convocatoria') || '';
  const statusFilter = params.get('estado') || 'all';
  const dateFrom = params.get('desde') || '';
  const dateTo = params.get('hasta') || '';

  const setSearch = value => updateParam('q', value);

  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("kanban"); // "kanban" o "table"
  const [updatingId, setUpdatingId] = useState(null);
  const [statusFeedback, setStatusFeedback] = useState(null);
  const [showFilters, setShowFilters] = useState(
    Boolean(convocatoria || dateFrom || dateTo || statusFilter !== 'all')
  );

  const handleFilterChange = (key, value) => {
    updateParam(key, value === 'all' ? '' : value);
    setCurrentPage(1);
  };

  const clearAdvancedFilters = () => {
    setParams(previous => {
      const next = new URLSearchParams(previous);
      ['convocatoria', 'estado', 'desde', 'hasta'].forEach(k => next.delete(k));
      return next;
    }, { replace: true });
    setCurrentPage(1);
  };

  // Convocatorias disponibles (derivadas de los postulantes cargados).
  const convocatorias = useMemo(
    () => [...new Set(candidates.map(c => c.job).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [candidates]
  );

  const dateRangeInvalid = Boolean(dateFrom && dateTo && dateFrom > dateTo);
  const advancedFilters = { convocatoria, status: statusFilter, dateFrom, dateTo };
  const activeFilterCount =
    (convocatoria ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0);

  // Consulta que viajaría al backend en la integración real (RFC-2026-0001).
  // eslint-disable-next-line no-unused-vars
  const simulatedQuery = buildFilterQuery(advancedFilters);

  const perPage = 8;
  const filtered = applyAdvancedFilters(candidates, advancedFilters, dateRangeInvalid).filter(c => {
    const term = search.toLowerCase();
    return (c.name || '').toLowerCase().includes(term) ||
           (c.job || '').toLowerCase().includes(term);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(currentPage, totalPages);
  const paged = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  const handleStatusChange = async (candidateId, newStatus, comment) => {
    setUpdatingId(candidateId);
    setStatusFeedback(null);
    try {
      await updateCandidateStatus(candidateId, newStatus, comment);
      const labelMap = {
        recibida: "Recibidas",
        en_revision: "En Revisión",
        entrevista: "Entrevistas",
        aprobada: "Aprobados",
        rechazada: "Descartados"
      };
      setStatusFeedback({
        type: "success",
        message: `Candidato promovido a "${labelMap[newStatus] || newStatus}" con éxito.`
      });
      await retry();
    } catch (err) {
      console.error("Error al actualizar estado:", err);
      setStatusFeedback({
        type: "error",
        message: err.message || "No se pudo actualizar el estado del postulante."
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDownloadCv = async (c) => {
    if (!c?.cvUrl) return;
    try {
      const token = JSON.parse(localStorage.getItem('gtel-user') || '{}')?.token;
      const apiBase = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL ? import.meta.env.VITE_API_URL : 'http://localhost:8080').replace(/\/$/, '');
      const url = c.cvUrl.startsWith('http') ? c.cvUrl : apiBase + c.cvUrl;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('No se pudo descargar el archivo.');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${c.name.replace(/\s+/g, '_')}_CV.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert('Error al descargar CV: ' + err.message);
    }
  };

  const fieldClass =
    "w-full px-3 py-2 text-sm bg-[#F8FAFC] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]";
  const labelClass = "block text-xs font-semibold text-[#475569] mb-1.5";

  return (
    <div className="p-6">
      <DataState loading={loading} error={error} retry={retry} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#1E293B]">Pipeline de Candidatos</h1>
          <p className="text-sm text-[#475569]">
            {loading || error ? '—' : candidates.length} candidatos registrados en el proceso de selección
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Switcher de Vista: Kanban / Tabla */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "kanban"
                  ? "bg-white text-[#D32F2F] shadow-sm font-bold"
                  : "text-[#64748B] hover:text-[#1E293B]"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Kanban
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "table"
                  ? "bg-white text-[#D32F2F] shadow-sm font-bold"
                  : "text-[#64748B] hover:text-[#1E293B]"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              Tabla
            </button>
          </div>

          <button
            disabled
            title="Exportación pendiente de integración"
            className="inline-flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* Feedback banner */}
      {statusFeedback && (
        <div
          className={`mb-5 p-3.5 rounded-xl border flex items-center justify-between gap-3 text-sm transition-all ${
            statusFeedback.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusFeedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <span>{statusFeedback.message}</span>
          </div>
          <button
            onClick={() => setStatusFeedback(null)}
            className="p-1 hover:bg-black/5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              type="text"
              placeholder="Buscar por nombre o puesto..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-[#F8FAFC] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(v => !v)}
            aria-expanded={showFilters}
            aria-controls="advanced-filters"
            className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-colors ${
              showFilters || activeFilterCount
                ? "border-[#D32F2F] text-[#D32F2F] bg-[#D32F2F]/5"
                : "border-gray-200 text-[#475569] hover:bg-gray-50"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtros avanzados
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-[#D32F2F] text-white text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div id="advanced-filters" className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor="filter-convocatoria" className={labelClass}>Convocatoria</label>
                <select
                  id="filter-convocatoria"
                  value={convocatoria}
                  onChange={e => handleFilterChange('convocatoria', e.target.value || 'all')}
                  className={fieldClass}
                >
                  <option value="">Todas las convocatorias</option>
                  {convocatorias.map(job => (
                    <option key={job} value={job}>{job}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="filter-estado" className={labelClass}>Estado de la postulación</label>
                <select
                  id="filter-estado"
                  value={statusFilter}
                  onChange={e => handleFilterChange('estado', e.target.value)}
                  className={fieldClass}
                >
                  <option value="all">Todos los estados</option>
                  {Object.entries(statusConfig).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="filter-desde" className={labelClass}>Registrado desde</label>
                <input
                  id="filter-desde"
                  type="date"
                  value={dateFrom}
                  max={dateTo || undefined}
                  onChange={e => handleFilterChange('desde', e.target.value)}
                  className={fieldClass}
                />
              </div>

              <div>
                <label htmlFor="filter-hasta" className={labelClass}>Registrado hasta</label>
                <input
                  id="filter-hasta"
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={e => handleFilterChange('hasta', e.target.value)}
                  className={fieldClass}
                />
              </div>
            </div>

            {dateRangeInvalid && (
              <p role="alert" className="mt-3 flex items-center gap-1.5 text-xs text-[#D32F2F]">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                La fecha inicial es posterior a la final. El rango de fechas no se aplicará hasta corregirlo.
              </p>
            )}

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-[#64748B]">
                {loading || error
                  ? 'Cargando postulantes…'
                  : `${filtered.length} de ${candidates.length} postulantes coinciden`}
                {' · '}
                Filtros simulados en el navegador, pendientes de integración con la API.
              </p>
              <button
                type="button"
                onClick={clearAdvancedFilters}
                disabled={!activeFilterCount}
                className="self-start sm:self-auto text-xs font-semibold text-[#D32F2F] hover:underline disabled:text-gray-300 disabled:no-underline disabled:cursor-not-allowed"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        )}

        {/* Chips de filtros activos (visibles aunque el panel esté cerrado) */}
        {activeFilterCount > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {convocatoria && (
              <FilterChip label={`Convocatoria: ${convocatoria}`} onRemove={() => handleFilterChange('convocatoria', 'all')} />
            )}
            {statusFilter !== 'all' && (
              <FilterChip
                label={`Estado: ${statusConfig[statusFilter]?.label || statusFilter}`}
                onRemove={() => handleFilterChange('estado', 'all')}
              />
            )}
            {dateFrom && (
              <FilterChip label={`Desde: ${formatInputDate(dateFrom)}`} onRemove={() => handleFilterChange('desde', 'all')} />
            )}
            {dateTo && (
              <FilterChip label={`Hasta: ${formatInputDate(dateTo)}`} onRemove={() => handleFilterChange('hasta', 'all')} />
            )}
          </div>
        )}
      </div>

      {/* Main Content: Kanban or Table */}
      {viewMode === "kanban" ? (
        <CandidateKanbanBoard
          candidates={filtered}
          onStatusChange={handleStatusChange}
          updatingId={updatingId}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-gray-100">
                  <th className="px-5 py-3.5 text-left text-[10px] font-bold text-[#475569] uppercase tracking-wider">Candidato</th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-bold text-[#475569] uppercase tracking-wider">Puesto</th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-bold text-[#475569] uppercase tracking-wider hidden md:table-cell">Fecha</th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-bold text-[#475569] uppercase tracking-wider hidden lg:table-cell">Puntaje</th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-bold text-[#475569] uppercase tracking-wider">Estado</th>
                  <th className="px-5 py-3.5 text-right text-[10px] font-bold text-[#475569] uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {!loading && !error && !filtered.length && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-sm text-brand-gray">
                      {candidates.length ? "No hay resultados para estos filtros." : "No hay postulantes disponibles."}
                    </td>
                  </tr>
                )}
                {paged.map((c, idx) => {
                  const s = statusConfig[c.status] || { label: 'N/D', color: 'bg-slate-100 text-slate-600' };
                  return (
                    <tr key={c.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                            {c.avatar}
                          </div>
                          <span className="text-sm font-medium text-[#1E293B] whitespace-nowrap">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-[#475569]">{c.job}</td>
                      <td className="px-5 py-3.5 text-xs text-[#475569] hidden md:table-cell">{c.date}</td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden w-16">
                            <div
                              className={`h-full rounded-full ${c.score >= 85 ? "bg-green-500" : c.score >= 70 ? "bg-yellow-500" : "bg-[#D32F2F]"}`}
                              style={{ width: `${c.score ?? 0}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-[#1E293B]">{c.score == null ? 'N/D' : `${c.score}%`}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${s.color}`}>
                          {s.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/reclutador/postulantes/${encodeURIComponent(c.id)}`}
                            className="p-1.5 text-[#475569] hover:text-[#D32F2F] hover:bg-[#D32F2F]/10 rounded-lg transition-colors"
                            title="Ver perfil completo"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            disabled={!c.cvUrl}
                            onClick={() => handleDownloadCv(c)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              c.cvUrl ? "text-[#475569] hover:text-blue-600 hover:bg-blue-50 cursor-pointer" : "text-gray-300 cursor-not-allowed"
                            }`}
                            title={c.cvUrl ? "Descargar currículum vitae" : "Sin CV adjunto"}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-5 py-3.5 border-t border-gray-100 bg-[#F8FAFC] flex items-center justify-between">
            <p className="text-xs text-[#475569]">
              Mostrando {filtered.length ? (safePage - 1) * perPage + 1 : 0}–{Math.min(safePage * perPage, filtered.length)} de {filtered.length} resultados
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
                disabled={safePage === 1}
                className="p-1.5 rounded-lg text-[#475569] hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                    safePage === i + 1 ? "bg-[#D32F2F] text-white" : "text-[#475569] hover:bg-gray-200"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
                disabled={safePage === totalPages}
                className="p-1.5 rounded-lg text-[#475569] hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-full bg-[#D32F2F]/10 text-[#B71C1C] text-xs font-medium">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Quitar filtro ${label}`}
        className="p-0.5 rounded-full hover:bg-[#D32F2F]/20 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}
