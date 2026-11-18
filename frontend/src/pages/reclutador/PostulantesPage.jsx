import useRecruiterData from "../../hooks/useRecruiterData";
import DataState from "../../components/ui/DataState";
import { getRecruiterCandidates, updateCandidateStatus } from "../../services/api";
import CandidateKanbanBoard from "../../components/recruiter/CandidateKanbanBoard";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  Eye,
  Download,
  Filter,
  ChevronDown,
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
    color: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
  },
  interview: {
    label: "Entrevista",
    color: "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300"
  },
  reviewing: {
    label: "En revisión",
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300"
  },
  approved: {
    label: "Aprobado",
    color: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300"
  },
  rejected: {
    label: "Descartado",
    color: "bg-red-100 text-[#D32F2F] dark:bg-red-950/50 dark:text-red-300"
  }
};

const avatarColors = [
  "bg-[#D32F2F]", "bg-blue-600", "bg-green-600", "bg-purple-600",
  "bg-orange-600", "bg-teal-600", "bg-pink-600", "bg-indigo-600",
  "bg-cyan-600", "bg-amber-600"
];

export default function CandidateDirectory() {
  const { data, loading, error, retry } = useRecruiterData(getRecruiterCandidates);
  const candidates = data || [];
  const [params, setParams] = useSearchParams();
  const search = params.get('q') || '';
  const setSearch = value => setParams(previous => {
    const next = new URLSearchParams(previous);
    value ? next.set('q', value) : next.delete('q');
    return next;
  }, { replace: true });

  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("kanban"); // "kanban" o "table"
  const [updatingId, setUpdatingId] = useState(null);
  const [statusFeedback, setStatusFeedback] = useState(null);

  const perPage = 8;
  const filtered = candidates.filter(c => {
    const matchSearch = (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
                        (c.job || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

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

  return (
    <div className="recruiter-page p-4 sm:p-6">
      <DataState loading={loading} error={error} retry={retry} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="recruiter-title text-xl">Pipeline de Candidatos</h1>
          <p className="recruiter-copy text-sm">
            {loading || error ? '—' : candidates.length} candidatos registrados en el proceso de selección
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Switcher de Vista: Kanban / Tabla */}
          <div className="flex items-center rounded-xl border border-app-border bg-app-muted p-1">
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "kanban"
                  ? "bg-app-surface text-app-accent shadow-sm font-bold"
                  : "text-app-secondary hover:text-app-primary"
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
                  ? "bg-app-surface text-app-accent shadow-sm font-bold"
                  : "text-app-secondary hover:text-app-primary"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              Tabla
            </button>
          </div>

          <button
            disabled
            title="Exportación pendiente de integración"
            className="inline-flex items-center gap-2 rounded-lg bg-app-action px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-app-action-hover disabled:opacity-60"
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
              ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-950/40 dark:border-green-800 dark:text-green-300"
              : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300"
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
      <div className="recruiter-card mb-5 flex flex-col gap-3 p-4 sm:flex-row">
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
            className="recruiter-field w-full py-2 pl-9 pr-4 text-sm"
          />
        </div>
        {viewMode === "table" && (
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="recruiter-field appearance-none py-2 pl-9 pr-8 text-sm"
            >
              <option value="all">Todos los estados</option>
              <option value="new">Nuevo</option>
              <option value="reviewing">En revisión</option>
              <option value="interview">Entrevista</option>
              <option value="approved">Aprobado</option>
              <option value="rejected">Descartado</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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
        <div className="recruiter-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="recruiter-table-head">
                  <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider">Candidato</th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider">Puesto</th>
                  <th className="hidden px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider md:table-cell">Fecha</th>
                  <th className="hidden px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider lg:table-cell">Puntaje</th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider">Estado</th>
                  <th className="px-5 py-3.5 text-right text-[10px] font-bold uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {!loading && !error && !filtered.length && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-sm text-brand-gray">
                      {candidates.length ? "No hay resultados para estos filtros." : "No hay postulantes disponibles."}
                    </td>
                  </tr>
                )}
                {paged.map((c, idx) => {
                  const s = statusConfig[c.status] || { label: 'N/D', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' };
                  return (
                    <tr key={c.id} className="recruiter-table-row">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                            {c.avatar}
                          </div>
                          <span className="whitespace-nowrap text-sm font-medium text-app-primary">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-app-body">{c.job}</td>
                      <td className="hidden px-5 py-3.5 text-xs text-app-secondary md:table-cell">{c.date}</td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 flex-1 overflow-hidden rounded-full bg-app-muted">
                            <div
                              className={`h-full rounded-full ${c.score >= 85 ? "bg-green-500" : c.score >= 70 ? "bg-yellow-500" : "bg-[#D32F2F]"}`}
                              style={{ width: `${c.score ?? 0}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-app-primary">{c.score == null ? 'N/D' : `${c.score}%`}</span>
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
                            className="rounded-lg p-1.5 text-app-secondary transition-colors hover:bg-app-danger-soft hover:text-app-accent"
                            title="Ver perfil completo"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            disabled={!c.cvUrl}
                            onClick={() => handleDownloadCv(c)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              c.cvUrl ? "cursor-pointer text-app-secondary hover:bg-app-info hover:text-app-info-icon" : "cursor-not-allowed text-app-border-strong"
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
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-app-border bg-app-muted px-5 py-3.5">
            <p className="text-xs text-app-secondary">
              Mostrando {filtered.length ? (currentPage - 1) * perPage + 1 : 0}–{Math.min(currentPage * perPage, filtered.length)} de {filtered.length} resultados
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg p-1.5 text-app-secondary transition-colors hover:bg-app-surface disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                    currentPage === i + 1 ? "bg-app-action text-white" : "text-app-secondary hover:bg-app-surface"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg p-1.5 text-app-secondary transition-colors hover:bg-app-surface disabled:cursor-not-allowed disabled:opacity-40"
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
