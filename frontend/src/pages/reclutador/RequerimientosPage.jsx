import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileCheck2,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Building2,
  AlertCircle,
  X,
  Send,
  MessageSquare,
  PlusSquare
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getRecruiterRequirements,
  createRecruiterRequirement,
  updateRecruiterRequirementStatus,
  getRecruiterDepartments
} from "../../services/api";

const statusConfig = {
  pendiente: {
    label: "Pendiente",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    icon: Clock,
    iconColor: "text-amber-600"
  },
  aprobado: {
    label: "Aprobado",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: CheckCircle2,
    iconColor: "text-emerald-600"
  },
  rechazado: {
    label: "Rechazado",
    badge: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
    iconColor: "text-red-600"
  },
  cerrado: {
    label: "Cerrado",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    icon: CheckCircle2,
    iconColor: "text-slate-600"
  }
};

export default function RequerimientosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isRecruiterOrAdmin = ["RECLUTADOR", "ADMIN"].includes(user?.rol);

  const [requirements, setRequirements] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filterState, setFilterState] = useState("todos");
  const [search, setSearch] = useState("");

  // Modal para nuevo requerimiento
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDeptId, setNewDeptId] = useState("");
  const [newVacancies, setNewVacancies] = useState(1);
  const [newDescription, setNewDescription] = useState("");
  const [newObservations, setNewObservations] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Modal para cambiar estado (Aprobar / Rechazar)
  const [statusModal, setStatusModal] = useState({
    open: false,
    req: null,
    targetStatus: "",
    observations: "",
    saving: false
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [reqList, deptList] = await Promise.all([
        getRecruiterRequirements(),
        getRecruiterDepartments().catch(() => [])
      ]);
      setRequirements(reqList || []);
      setDepartments(deptList || []);
    } catch (err) {
      setError(err?.message || "No se pudieron cargar los requerimientos de personal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!newTitle.trim()) {
      setFormError("Ingresa el título de la vacante solicitada.");
      return;
    }
    if (!newDeptId) {
      setFormError("Selecciona el departamento solicitante.");
      return;
    }
    if (!newDescription.trim()) {
      setFormError("Describe el perfil y justificación de la necesidad.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createRecruiterRequirement({
        titulo: newTitle.trim(),
        departamentoId: Number(newDeptId),
        cantidad: Number(newVacancies) || 1,
        descripcion: newDescription.trim(),
        observaciones: newObservations.trim() || null
      });

      setRequirements((prev) => [created, ...prev]);
      setShowCreateModal(false);
      setNewTitle("");
      setNewDeptId("");
      setNewVacancies(1);
      setNewDescription("");
      setNewObservations("");
    } catch (err) {
      setFormError(err?.message || "Error al crear el requerimiento.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenStatusModal = (req, targetStatus) => {
    setStatusModal({
      open: true,
      req,
      targetStatus,
      observations: "",
      saving: false
    });
  };

  const handleConfirmStatusChange = async () => {
    if (!statusModal.req) return;
    setStatusModal((prev) => ({ ...prev, saving: true }));

    try {
      const updated = await updateRecruiterRequirementStatus(
        statusModal.req.id,
        statusModal.targetStatus,
        statusModal.observations
      );

      setRequirements((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );

      setStatusModal({ open: false, req: null, targetStatus: "", observations: "", saving: false });
    } catch (err) {
      alert("Error al actualizar estado: " + (err?.message || "Error desconocido"));
      setStatusModal((prev) => ({ ...prev, saving: false }));
    }
  };

  const handleConvertToJob = (req) => {
    navigate(
      `/reclutador/publicar-oferta?title=${encodeURIComponent(req.title)}&department=${encodeURIComponent(
        req.department
      )}&vacancies=${encodeURIComponent(req.vacancies)}`
    );
  };

  // Filtrado
  const filtered = requirements.filter((item) => {
    const matchesFilter = filterState === "todos" || item.status === filterState;
    const matchesSearch =
      !search ||
      (item.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.department || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.solicitanteEmail || "").toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const countTotal = requirements.length;
  const countPendiente = requirements.filter((r) => r.status === "pendiente").length;
  const countAprobado = requirements.filter((r) => r.status === "aprobado").length;
  const countRechazado = requirements.filter((r) => r.status === "rechazado").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-[#1E293B] dark:text-slate-100">Requerimientos de Personal</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              {user?.rol === "JEFATURA_SOLICITANTE" ? "Mis Solicitudes" : "Módulo de Aprobaciones"}
            </span>
          </div>
          <p className="text-sm text-[#475569] dark:text-slate-400 mt-0.5">
            Gestión de solicitudes de vacantes operativas y técnicas entre jefaturas y RRHH
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          + Solicitar Personal
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#1E293B] dark:text-slate-100">{countTotal}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total de Solicitudes</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#1E293B] dark:text-slate-100">{countPendiente}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Pendientes de Aprobación</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#1E293B] dark:text-slate-100">{countAprobado}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Aprobadas para Convocatoria</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center text-red-600 dark:text-red-400">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#1E293B] dark:text-slate-100">{countRechazado}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Rechazadas o Desestimadas</div>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {["todos", "pendiente", "aprobado", "rechazado"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterState(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${
                filterState === st
                  ? "bg-slate-900 text-white dark:bg-brand-red dark:text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {st === "todos" ? "Todos los Estados" : st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por puesto o área..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] outline-none"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F8FAFC] dark:bg-slate-800/60 border-b border-gray-100 dark:border-slate-800">
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-[#475569] dark:text-slate-400 uppercase tracking-wider">
                  Posición Solicitada
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-[#475569] dark:text-slate-400 uppercase tracking-wider">
                  Área / Departamento
                </th>
                <th className="px-5 py-3 text-center text-[10px] font-semibold text-[#475569] dark:text-slate-400 uppercase tracking-wider">
                  Vacantes
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-[#475569] dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">
                  Solicitante
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-[#475569] dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                  Fecha Solicitud
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-[#475569] dark:text-slate-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-5 py-3 text-right text-[10px] font-semibold text-[#475569] dark:text-slate-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
              {loading && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    Cargando requerimientos de personal...
                  </td>
                </tr>
              )}

              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No se encontraron requerimientos registrados con los filtros aplicados.
                  </td>
                </tr>
              )}

              {filtered.map((req) => {
                const conf = statusConfig[req.status] || statusConfig.pendiente;
                const StatusIcon = conf.icon;

                return (
                  <tr key={req.id} className="hover:bg-[#F8FAFC] dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-sm text-[#1E293B] dark:text-slate-100">{req.title}</div>
                      {req.description && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 max-w-sm truncate mt-0.5">
                          {req.description}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{req.department}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        {req.vacancies}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-400 hidden md:table-cell whitespace-nowrap">
                      {req.solicitanteEmail}
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400 hidden lg:table-cell whitespace-nowrap">
                      {req.date}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${conf.badge}`}
                      >
                        <StatusIcon className={`w-3 h-3 ${conf.iconColor}`} />
                        {conf.label}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Acciones para Reclutador o Admin */}
                        {isRecruiterOrAdmin && req.status === "pendiente" && (
                          <>
                            <button
                              onClick={() => handleOpenStatusModal(req, "aprobado")}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800"
                              title="Aprobar requerimiento"
                            >
                              Aprobar
                            </button>
                            <button
                              onClick={() => handleOpenStatusModal(req, "rechazado")}
                              className="px-2.5 py-1 text-xs font-semibold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors border border-red-200 dark:border-red-800"
                              title="Rechazar requerimiento"
                            >
                              Rechazar
                            </button>
                          </>
                        )}

                        {/* Convertir a Oferta para requerimientos aprobados */}
                        {isRecruiterOrAdmin && req.status === "aprobado" && (
                          <button
                            onClick={() => handleConvertToJob(req)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
                            title="Publicar como vacante en el portal"
                          >
                            <PlusSquare className="w-3.5 h-3.5" />
                            Publicar Oferta
                          </button>
                        )}

                        {/* Observaciones / Notas */}
                        {req.observations && (
                          <div
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-help"
                            title={`Observaciones: ${req.observations}`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Crear Nuevo Requerimiento de Personal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#1E293B] dark:text-slate-100">Solicitar Requerimiento de Personal</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Título de la Posición o Cargo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej. Ingeniero de Conectividad Fibra Óptica N2"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 rounded-lg focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Departamento de Destino <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={newDeptId}
                    onChange={(e) => setNewDeptId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] outline-none bg-white"
                  >
                    <option value="">Selecciona un área...</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Número de Vacantes <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={newVacancies}
                    onChange={(e) => setNewVacancies(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Justificación y Perfil Requerido <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows="3"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Indica la necesidad del área, funciones principales, nivel de experiencia y conocimientos técnicos requeridos."
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 rounded-lg focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] outline-none resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Observaciones adicionales (Opcional)
                </label>
                <input
                  type="text"
                  value={newObservations}
                  onChange={(e) => setNewObservations(e.target.value)}
                  placeholder="Ej. Urgente para inicio de guardia el próximo mes"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 rounded-lg focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? "Enviando..." : "Enviar a RRHH"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cambiar Estado (Aprobar / Rechazar) */}
      {statusModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-[#1E293B] dark:text-slate-100">
                {statusModal.targetStatus === "aprobado" ? "Aprobar Requerimiento" : "Rechazar Requerimiento"}
              </h3>
              <button
                onClick={() => setStatusModal({ open: false, req: null, targetStatus: "", observations: "", saving: false })}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
              <p>
                Estás a punto de marcar como{" "}
                <strong className={statusModal.targetStatus === "aprobado" ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}>
                  {statusModal.targetStatus.toUpperCase()}
                </strong>{" "}
                el requerimiento para la posición:
              </p>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg font-semibold text-slate-800 dark:text-slate-200">
                {statusModal.req?.title} ({statusModal.req?.department})
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Observaciones o Justificación de RRHH:</label>
              <textarea
                rows="3"
                value={statusModal.observations}
                onChange={(e) => setStatusModal((prev) => ({ ...prev, observations: e.target.value }))}
                placeholder="Ingresa notas para el solicitante sobre la decisión tomada..."
                className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 rounded-lg focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] outline-none text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
              <button
                onClick={() => setStatusModal({ open: false, req: null, targetStatus: "", observations: "", saving: false })}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmStatusChange}
                disabled={statusModal.saving}
                className={`px-4 py-2 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                  statusModal.targetStatus === "aprobado"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {statusModal.saving ? "Guardando..." : "Confirmar Decisión"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
