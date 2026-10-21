import useRecruiterData from "../../hooks/useRecruiterData";
import DataState from "../../components/ui/DataState";
import { getRecruiterEvaluations, getRecruiterCandidates, createRecruiterEvaluation } from "../../services/api";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Eye, Download, ChevronDown, Filter, BarChart2, Clock, CheckCircle, XCircle, Plus, Trash2, X, AlertCircle, CheckCircle2 } from "lucide-react";

const statusConfig = {
  passed: {
    label: "Aprobado",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle,
    bar: "bg-green-500"
  },
  review: {
    label: "En revisión",
    color: "bg-yellow-100 text-yellow-700",
    icon: Clock,
    bar: "bg-yellow-500"
  },
  failed: {
    label: "No aprobó",
    color: "bg-red-100 text-[#D32F2F]",
    icon: XCircle,
    bar: "bg-[#D32F2F]"
  }
};

export default function Evaluations() {
  const { data, loading, error, retry } = useRecruiterData(getRecruiterEvaluations);
  const evaluations = data || [];
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTest, setFilterTest] = useState("all");
  const [expanded, setExpanded] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [candidatesList, setCandidatesList] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Form Fields
  const [formCandidateId, setFormCandidateId] = useState("");
  const [formTest, setFormTest] = useState("Evaluación Técnica");
  const [formTime, setFormTime] = useState(45);
  const [criteria, setCriteria] = useState([
    { area: "Conocimientos Técnicos en Redes y Fibra", weight: 40, score: 80 },
    { area: "Resolución de Fallas y Diagnóstico", weight: 30, score: 75 },
    { area: "Habilidades Blandas y Comunicación", weight: 30, score: 85 }
  ]);

  // Derived calculations
  const totalWeight = criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
  const computedScore = totalWeight > 0
    ? Math.round(criteria.reduce((sum, c) => sum + ((Number(c.score) || 0) * (Number(c.weight) || 0)), 0) / totalWeight)
    : 0;
  const computedStatus = computedScore >= 75 ? "aprobado" : computedScore >= 60 ? "en_revision" : "no_aprobado";

  useEffect(() => {
    if (showModal) {
      setLoadingCandidates(true);
      getRecruiterCandidates()
        .then(res => setCandidatesList(res || []))
        .catch(err => console.warn("Error cargando candidatos:", err))
        .finally(() => setLoadingCandidates(false));
    }
  }, [showModal]);

  const handleOpenModal = () => {
    setFeedback(null);
    setShowModal(true);
  };

  const handleAddCriterion = () => {
    setCriteria([...criteria, { area: "", weight: 20, score: 70 }]);
  };

  const handleRemoveCriterion = (index) => {
    if (criteria.length <= 1) return;
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const handleCriterionChange = (index, field, value) => {
    const updated = [...criteria];
    updated[index] = { ...updated[index], [field]: value };
    setCriteria(updated);
  };

  const handleSubmitEvaluation = async (e) => {
    e.preventDefault();
    if (!formCandidateId) {
      setFeedback({ type: "error", message: "Selecciona un candidato para la evaluación." });
      return;
    }
    if (criteria.some(c => !c.area.trim())) {
      setFeedback({ type: "error", message: "Todos los criterios deben tener un nombre o área definida." });
      return;
    }
    if (totalWeight <= 0) {
      setFeedback({ type: "error", message: "La ponderación total debe ser mayor a 0%." });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      await createRecruiterEvaluation({
        candidateId: formCandidateId,
        test: formTest,
        score: computedScore,
        time: Number(formTime),
        resultado: computedStatus,
        criteria: criteria.map(c => ({
          area: c.area.trim(),
          score: Math.min(100, Math.max(0, Number(c.score) || 0)),
          weight: Math.max(1, Number(c.weight) || 1)
        }))
      });
      setFeedback({
        type: "success",
        message: `¡Evaluación registrada con éxito! Puntaje final ponderado: ${computedScore}/100.`
      });
      setShowModal(false);
      await retry();
    } catch (err) {
      setFeedback({ type: "error", message: err.message || "No se pudo registrar la evaluación." });
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = evaluations.filter(e => {
    const matchStatus = filterStatus === "all" || e.status === filterStatus;
    const matchTest = filterTest === "all" || e.test === filterTest;
    return matchStatus && matchTest;
  });

  const tests = [...new Set(evaluations.map(e => e.test))];

  return (
    <div className="p-6">
      <DataState loading={loading} error={error} retry={retry} />

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1E293B]">Evaluaciones</h1>
          <p className="text-sm text-[#475569]">Resultados de pruebas y criterios de candidatos</p>
        </div>
        <button
          onClick={handleOpenModal}
          className="inline-flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          + Nueva Evaluación
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`mb-6 p-4 rounded-xl flex items-center justify-between gap-3 text-sm font-medium border ${
          feedback.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          {
            label: "Aprobados",
            value: loading || error ? "—" : evaluations.filter(e => e.status === "passed").length,
            color: "text-green-600",
            bg: "bg-green-50"
          },
          {
            label: "En revisión",
            value: loading || error ? "—" : evaluations.filter(e => e.status === "review").length,
            color: "text-yellow-600",
            bg: "bg-yellow-50"
          },
          {
            label: "No aprobaron",
            value: loading || error ? "—" : evaluations.filter(e => e.status === "failed").length,
            color: "text-[#D32F2F]",
            bg: "bg-red-50"
          }
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl p-4 text-center border border-white`}>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-[#475569]">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="appearance-none pl-9 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]"
          >
            <option value="all">Todos los estados</option>
            <option value="passed">Aprobados</option>
            <option value="review">En revisión</option>
            <option value="failed">No aprobados</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <BarChart2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={filterTest}
            onChange={e => setFilterTest(e.target.value)}
            className="appearance-none pl-9 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]"
          >
            <option value="all">Todas las pruebas</option>
            {tests.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Evaluation cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {!loading && !error && filtered.length === 0 && (
          <p className="col-span-full rounded-xl border border-gray-100 bg-white p-6 text-sm text-[#475569]">
            {evaluations.length ? "No hay resultados para estos filtros." : "No hay evaluaciones disponibles."}
          </p>
        )}
        {filtered.map(ev => {
          const s = statusConfig[ev.status] || {
            label: "N/D",
            color: "bg-slate-100 text-slate-600",
            icon: Clock,
            bar: "bg-slate-300"
          };
          const StatusIcon = s.icon;
          const isExpanded = expanded === ev.id;
          return (
            <div key={ev.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${ev.color} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                      {ev.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#1E293B]">{ev.name}</div>
                      <div className="text-xs text-[#475569]">{ev.job}</div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${s.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {s.label}
                  </span>
                </div>

                {/* Test info */}
                <div className="bg-[#F8FAFC] rounded-lg p-3 mb-3">
                  <div className="text-[10px] font-semibold text-[#475569] uppercase tracking-wide mb-1">{ev.test}</div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`text-2xl font-bold ${ev.score >= 80 ? "text-green-600" : ev.score >= 65 ? "text-yellow-600" : "text-[#D32F2F]"}`}>
                        {ev.score ?? 'N/D'}
                      </span>
                      <span className="text-xs text-[#475569]">/100</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[#475569]">
                      <Clock className="w-3 h-3" />
                      {ev.time}
                    </div>
                  </div>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${s.bar}`}
                      style={{ width: `${ev.score ?? 0}%` }}
                    />
                  </div>
                </div>

                {/* Breakdown (expandable) */}
                {isExpanded && (
                  <div className="space-y-2 mb-3">
                    {ev.details && ev.details.length > 0 ? (
                      ev.details.map((d, dIdx) => (
                        <div key={d.area || dIdx}>
                          <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-[#475569]">{d.area}</span>
                            <span className={`font-semibold ${d.score >= 80 ? "text-green-600" : d.score >= 65 ? "text-yellow-600" : "text-[#D32F2F]"}`}>
                              {d.score == null ? 'N/D' : `${d.score}%`}
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${d.score >= 80 ? "bg-green-500" : d.score >= 65 ? "bg-yellow-500" : "bg-[#D32F2F]"}`}
                              style={{ width: `${d.score ?? 0}%` }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-gray-400">Sin desglose de criterios detallado.</p>
                    )}
                  </div>
                )}

                <div className="text-[10px] text-[#475569] mb-3">{ev.date}</div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : ev.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-[#475569] py-2 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                  >
                    {isExpanded ? "Ocultar" : "Ver detalle"}
                    <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </button>
                  <Link
                    to={ev.candidateId ? `/reclutador/postulantes/${encodeURIComponent(ev.candidateId)}` : "/reclutador/postulantes"}
                    className="flex items-center justify-center gap-1 p-2 border border-gray-200 text-[#475569] rounded-lg hover:text-[#D32F2F] hover:border-[#D32F2F]/30 transition-colors"
                    title="Ver candidato"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => {
                      const reportText = `====================================================\nREPORTE DE EVALUACIÓN TÉCNICA - GTEL TALENTO\n====================================================\nCandidato: ${ev.name}\nPuesto: ${ev.job}\nPrueba: ${ev.test}\nFecha: ${ev.date}\nDuración: ${ev.time}\nPuntaje Final: ${ev.score}/100\nEstado: ${s.label}\n\nDesglose de Criterios Evaluados:\n` + (ev.details || []).map(d => `- ${d.area}: ${d.score}/100`).join('\n') + `\n\nGenerado por el Sistema ATS de GTEL Perú.`;
                      const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `Evaluacion_${ev.name.replace(/\s+/g, '_')}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex items-center justify-center gap-1 p-2 border border-gray-200 text-[#475569] rounded-lg hover:text-blue-600 hover:border-blue-200 transition-colors"
                    title="Descargar reporte de evaluación"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Nueva Evaluación */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-[#1E293B] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-[#D32F2F]" />
                <h3 className="font-bold text-base">Registrar Nueva Evaluación con Criterios</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitEvaluation} className="p-6 overflow-y-auto space-y-5">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#1E293B] uppercase mb-1">
                    Candidato <span className="text-[#D32F2F]">*</span>
                  </label>
                  <select
                    value={formCandidateId}
                    onChange={(e) => setFormCandidateId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] bg-white"
                  >
                    <option value="">Selecciona un candidato...</option>
                    {loadingCandidates ? (
                      <option disabled>Cargando postulantes...</option>
                    ) : candidatesList.length === 0 ? (
                      <option disabled>No hay candidatos disponibles</option>
                    ) : (
                      candidatesList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} — {c.job || "Postulante"}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E293B] uppercase mb-1">
                    Duración (min)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E293B] uppercase mb-1">
                  Tipo o Nombre de la Prueba
                </label>
                <select
                  value={formTest}
                  onChange={(e) => setFormTest(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] bg-white"
                >
                  <option value="Evaluación Técnica">Evaluación Técnica</option>
                  <option value="Evaluación de Redes e Infraestructura">Evaluación de Redes e Infraestructura</option>
                  <option value="Evaluación Psicolaboral">Evaluación Psicolaboral</option>
                  <option value="Entrevista por Competencias">Entrevista por Competencias</option>
                  <option value="Prueba Práctica de Fibra Óptica">Prueba Práctica de Fibra Óptica</option>
                </select>
              </div>

              {/* Dynamic Criteria Section */}
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-[#1E293B] uppercase">Criterios de Evaluación</h4>
                    <p className="text-[11px] text-gray-500">Define los factores a ponderar y su calificación de 0 a 100.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCriterion}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#D32F2F] hover:text-[#B71C1C] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Criterio
                  </button>
                </div>

                <div className="space-y-3">
                  {criteria.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex-1 min-w-0">
                        <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Área / Criterio</label>
                        <input
                          type="text"
                          value={item.area}
                          onChange={(e) => handleCriterionChange(index, "area", e.target.value)}
                          placeholder="Ej. Diagnóstico de empalmes"
                          required
                          className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#D32F2F]"
                        />
                      </div>
                      <div className="w-24">
                        <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Peso (%)</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={item.weight}
                          onChange={(e) => handleCriterionChange(index, "weight", e.target.value)}
                          required
                          className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#D32F2F] text-center"
                        />
                      </div>
                      <div className="w-24">
                        <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Nota (0-100)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.score}
                          onChange={(e) => handleCriterionChange(index, "score", e.target.value)}
                          required
                          className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#D32F2F] text-center font-bold"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCriterion(index)}
                        disabled={criteria.length <= 1}
                        className="mt-4 p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
                        title="Eliminar criterio"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Score Summary Box */}
                <div className="mt-4 pt-3 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-lg">
                  <div>
                    <span className="text-xs text-gray-500">Suma de pesos: </span>
                    <span className={`text-xs font-bold ${totalWeight === 100 ? "text-green-600" : "text-amber-600"}`}>
                      {totalWeight}% {totalWeight !== 100 ? "(Sugerido: 100%)" : "✓"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#1E293B] font-semibold">Puntaje Ponderado:</span>
                    <span className={`text-xl font-bold ${computedScore >= 75 ? "text-green-600" : computedScore >= 60 ? "text-yellow-600" : "text-[#D32F2F]"}`}>
                      {computedScore} / 100
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      computedStatus === "aprobado" ? "bg-green-100 text-green-700" : computedStatus === "en_revision" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                    }`}>
                      {computedStatus === "aprobado" ? "Aprobado" : computedStatus === "en_revision" ? "En Revisión" : "No Aprobado"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-bold bg-[#D32F2F] hover:bg-[#B71C1C] text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? "Registrando..." : "Guardar y Calificar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
