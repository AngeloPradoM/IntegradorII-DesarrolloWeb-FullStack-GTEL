import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  Eye,
  MessageSquare,
  CheckCircle,
  XCircle,
  Briefcase,
  Calendar,
  Download,
  ArrowRight
} from "lucide-react";

export const KANBAN_COLUMNS = [
  {
    key: "recibida",
    aliases: ["new", "recibida"],
    label: "Recibidas",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
    headerBg: "bg-slate-50 border-slate-200",
    dotColor: "bg-slate-500",
    icon: Clock
  },
  {
    key: "en_revision",
    aliases: ["reviewing", "en_revision"],
    label: "En Revisión",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    headerBg: "bg-amber-50/60 border-amber-200",
    dotColor: "bg-amber-500",
    icon: Eye
  },
  {
    key: "entrevista",
    aliases: ["interview", "entrevista"],
    label: "Entrevistas",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    headerBg: "bg-blue-50/60 border-blue-200",
    dotColor: "bg-blue-600",
    icon: MessageSquare
  },
  {
    key: "aprobada",
    aliases: ["approved", "aprobada"],
    label: "Aprobados",
    badgeColor: "bg-green-100 text-green-800 border-green-200",
    headerBg: "bg-green-50/60 border-green-200",
    dotColor: "bg-green-600",
    icon: CheckCircle
  },
  {
    key: "rechazada",
    aliases: ["rejected", "rechazada"],
    label: "Descartados",
    badgeColor: "bg-red-100 text-red-800 border-red-200",
    headerBg: "bg-red-50/60 border-red-200",
    dotColor: "bg-red-500",
    icon: XCircle
  }
];

export default function CandidateKanbanBoard({ candidates = [], onStatusChange, updatingId = null }) {
  const [draggedCandidate, setDraggedCandidate] = useState(null);
  const [activeDropCol, setActiveDropCol] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [downloadingCvId, setDownloadingCvId] = useState(null);

  const getCandidateColKey = (c) => {
    const st = (c.status || "").toLowerCase();
    const found = KANBAN_COLUMNS.find(col => col.aliases.includes(st) || col.key === st);
    return found ? found.key : "recibida";
  };

  const handleDragStart = (e, candidate) => {
    setDraggedCandidate(candidate);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", candidate.id);
  };

  const handleDragEnd = () => {
    setDraggedCandidate(null);
    setActiveDropCol(null);
  };

  const handleDragOver = (e, colKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (activeDropCol !== colKey) {
      setActiveDropCol(colKey);
    }
  };

  const handleDrop = async (e, targetColKey) => {
    e.preventDefault();
    setActiveDropCol(null);
    if (!draggedCandidate) return;

    const sourceColKey = getCandidateColKey(draggedCandidate);
    if (sourceColKey === targetColKey) {
      setDraggedCandidate(null);
      return;
    }

    if (onStatusChange) {
      await onStatusChange(draggedCandidate.id, targetColKey);
    }
    setDraggedCandidate(null);
  };

  const downloadCvDirectly = async (e, candidate) => {
    e.stopPropagation();
    if (!candidate?.cvUrl) return;
    setDownloadingCvId(candidate.id);
    try {
      const token = JSON.parse(localStorage.getItem("gtel-user") || "{}")?.token;
      const apiBase = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL ? import.meta.env.VITE_API_URL : "http://localhost:8080").replace(/\/$/, "");
      const url = candidate.cvUrl.startsWith("http") ? candidate.cvUrl : apiBase + candidate.cvUrl;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Error al descargar");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${candidate.name.replace(/\s+/g, "_")}_CV.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert("No se pudo descargar el CV: " + err.message);
    } finally {
      setDownloadingCvId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start pb-6">
      {KANBAN_COLUMNS.map((col) => {
        const colCandidates = candidates.filter((c) => getCandidateColKey(c) === col.key);
        const IconComponent = col.icon;
        const isDragTarget = activeDropCol === col.key;

        return (
          <div
            key={col.key}
            onDragOver={(e) => handleDragOver(e, col.key)}
            onDragLeave={() => setActiveDropCol(null)}
            onDrop={(e) => handleDrop(e, col.key)}
            className={`flex flex-col bg-slate-50/80 rounded-xl border transition-all duration-200 min-h-[500px] ${
              isDragTarget
                ? "border-brand-red ring-2 ring-brand-red/20 bg-red-50/30"
                : "border-slate-200/80"
            }`}
          >
            {/* Column Header */}
            <div className={`p-3.5 border-b rounded-t-xl flex items-center justify-between ${col.headerBg}`}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                <h3 className="text-xs font-bold text-slate-800 tracking-wide uppercase">{col.label}</h3>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${col.badgeColor}`}>
                {colCandidates.length}
              </span>
            </div>

            {/* Column Body / Cards */}
            <div className="p-2.5 flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)]">
              {colCandidates.length === 0 ? (
                <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-lg">
                  <IconComponent className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Sin candidatos</p>
                  <p className="text-[10px] text-slate-400">Arrastra aquí para mover</p>
                </div>
              ) : (
                colCandidates.map((candidate) => {
                  const isUpdating = updatingId === candidate.id;
                  const isMenuOpen = openMenuId === candidate.id;

                  return (
                    <div
                      key={candidate.id}
                      draggable={!isUpdating}
                      onDragStart={(e) => handleDragStart(e, candidate)}
                      onDragEnd={handleDragEnd}
                      className={`group bg-white rounded-lg p-3.5 border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing relative ${
                        isUpdating ? "opacity-50 pointer-events-none" : ""
                      }`}
                    >
                      {/* Top: Avatar + Name + Score */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {candidate.avatar || candidate.name?.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/reclutador/postulantes/${encodeURIComponent(candidate.id)}`}
                              className="text-xs font-bold text-slate-800 hover:text-brand-red truncate block"
                              title={candidate.name}
                            >
                              {candidate.name}
                            </Link>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              ID: {candidate.id}
                            </span>
                          </div>
                        </div>

                        {candidate.score != null && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0 ${
                              candidate.score >= 80
                                ? "bg-green-100 text-green-700"
                                : candidate.score >= 60
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                            title="Puntuación ATS"
                          >
                            {candidate.score}%
                          </span>
                        )}
                      </div>

                      {/* Job Title */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-2 font-medium">
                        <Briefcase className="w-3.5 h-3.5 text-brand-red flex-shrink-0" />
                        <span className="truncate">{candidate.job}</span>
                      </div>

                      {/* Details row: Date + Department */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {candidate.appliedDate || candidate.date}
                        </span>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          {candidate.cvUrl && (
                            <button
                              type="button"
                              onClick={(e) => downloadCvDirectly(e, candidate)}
                              disabled={downloadingCvId === candidate.id}
                              title="Descargar CV"
                              className="p-1 text-slate-400 hover:text-brand-red rounded hover:bg-slate-50 transition-colors"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                          )}

                          {/* Quick move dropdown button */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(isMenuOpen ? null : candidate.id);
                              }}
                              title="Cambiar fase"
                              className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>

                            {isMenuOpen && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 bottom-full mb-1 w-36 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50 text-left"
                              >
                                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                                  Mover a:
                                </div>
                                {KANBAN_COLUMNS.filter((target) => target.key !== col.key).map((target) => (
                                  <button
                                    key={target.key}
                                    type="button"
                                    onClick={async () => {
                                      setOpenMenuId(null);
                                      if (onStatusChange) {
                                        await onStatusChange(candidate.id, target.key);
                                      }
                                    }}
                                    className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${target.dotColor}`} />
                                    {target.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
