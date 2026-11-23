import useRecruiterData from "../../hooks/useRecruiterData";
import DataState from "../../components/ui/DataState";
import { getRecruiterEvaluations, getRecruiterCandidates, createRecruiterEvaluation } from "../../services/api";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Eye, Download, ChevronDown, Filter, BarChart2, Clock, CheckCircle, XCircle, Plus, Trash2, X, AlertCircle, CheckCircle2 } from "lucide-react";

const statusConfig = {
  passed: {
    label: "Aprobado",
    color: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300",
    icon: CheckCircle,
    bar: "bg-green-500"
  },
  review: {
    label: "En revisión",
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300",
    icon: Clock,
    bar: "bg-yellow-500"
  },
  failed: {
    label: "No aprobó",
    color: "bg-red-100 text-[#D32F2F] dark:bg-red-950/50 dark:text-red-300",
    icon: XCircle,
    bar: "bg-[#D32F2F]"
  }
};
const fieldClassName = "recruiter-field w-full px-3 py-2 text-sm";

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
    <div className="recruiter-page p-4 sm:p-6">
      <DataState loading={loading} error={error} retry={retry} />

      {/* Header */}
      <div className="recruiter-page-header">
        <div>
          <h1 className="recruiter-title text-xl">Evaluaciones</h1>
          <p className="recruiter-copy text-sm">Resultados de pruebas y criterios de candidatos</p>
        </div>
        <button
          onClick={handleOpenModal}
          className="recruiter-action-primary"
        >
          <Plus className="w-4 h-4" />
          Nueva Evaluación
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`mb-6 p-4 rounded-xl flex items-center justify-between gap-3 text-sm font-medium border ${
          feedback.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/40 dark:border-green-800 dark:text-green-300'
            : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-app-secondary hover:text-app-primary">
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
            bg: "bg-green-50 border-green-100 dark:bg-green-950/35 dark:border-green-900"
          },
          {
            label: "En revisión",
            value: loading || error ? "—" : evaluations.filter(e => e.status === "review").length,
            color: "text-yellow-600",
            bg: "bg-yellow-50 border-yellow-100 dark:bg-yellow-950/35 dark:border-yellow-900"
          },
          {
            label: "No aprobaron",
            value: loading || error ? "—" : evaluations.filter(e => e.status === "failed").length,
            color: "text-[#D32F2F]",
            bg: "bg-red-50 border-red-100 dark:bg-red-950/35 dark:border-red-900"
          }
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl border p-4 text-center`}>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-app-secondary">{label}</div>
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
            className="recruiter-field appearance-none py-2 pl-9 pr-8 text-sm"
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
            className="recruiter-field appearance-none py-2 pl-9 pr-8 text-sm"
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
          <p className="recruiter-empty col-span-full bg-app-surface p-6 text-sm">
            {evaluations.length ? "No hay resultados para estos filtros." : "No hay evaluaciones disponibles."}
          </p>
        )}
        {filtered.map(ev => {
          const s = statusConfig[ev.status] || {
            label: "N/D",
            color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
            icon: Clock,
            bar: "bg-slate-300"
          };
          const StatusIcon = s.icon;
          const isExpanded = expanded === ev.id;
          return (
            <div key={ev.id} className="recruiter-card recruiter-card-interactive overflow-hidden">
              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${ev.color} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                      {ev.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-app-primary">{ev.name}</div>
                      <div className="text-xs text-app-secondary">{ev.job}</div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${s.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {s.label}
                  </span>
                </div>

                {/* Test info */}
                <div className="mb-3 rounded-lg bg-app-muted p-3">
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-app-secondary">{ev.test}</div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`text-2xl font-bold ${ev.score >= 80 ? "text-green-600" : ev.score >= 65 ? "text-yellow-600" : "text-[#D32F2F]"}`}>
                        {ev.score ?? 'N/D'}
                      </span>
                      <span className="text-xs text-app-secondary">/100</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-app-secondary">
                      <Clock className="w-3 h-3" />
                      {ev.time}
                    </div>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-app-border-strong">
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
                            <span className="text-app-secondary">{d.area}</span>
                            <span className={`font-semibold ${d.score >= 80 ? "text-green-600" : d.score >= 65 ? "text-yellow-600" : "text-[#D32F2F]"}`}>
                              {d.score == null ? 'N/D' : `${d.score}%`}
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-app-muted">
                            <div
                              className={`h-full rounded-full ${d.score >= 80 ? "bg-green-500" : d.score >= 65 ? "bg-yellow-500" : "bg-[#D32F2F]"}`}
                              style={{ width: `${d.score ?? 0}%` }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-app-secondary">Sin desglose de criterios detallado.</p>
                    )}
                  </div>
                )}

                <div className="mb-3 text-[10px] text-app-secondary">{ev.date}</div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : ev.id)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-app-border py-2 text-xs font-medium text-app-secondary transition-colors hover:bg-app-muted hover:text-app-primary"
                  >
                    {isExpanded ? "Ocultar" : "Ver detalle"}
                    <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </button>
                  <Link
                    to={ev.candidateId ? `/reclutador/postulantes/${encodeURIComponent(ev.candidateId)}` : "/reclutador/postulantes"}
                    className="flex items-center justify-center gap-1 rounded-lg border border-app-border p-2 text-app-secondary transition-colors hover:border-app-action hover:text-app-accent"
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
                    className="flex items-center justify-center gap-1 rounded-lg border border-app-border p-2 text-app-secondary transition-colors hover:border-app-info-icon hover:text-app-info-icon"
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
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between bg-[#1E293B] px-6 py-4 text-white dark:bg-app-muted">
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
                  <label className="mb-1 block text-xs font-bold uppercase text-app-primary">
                    Candidato <span className="text-[#D32F2F]">*</span>
                  </label>
                  <select
                    value={formCandidateId}
                    onChange={(e) => setFormCandidateId(e.target.value)}
                    required
                    className={fieldClassName}
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
                  <label className="mb-1 block text-xs font-bold uppercase text-app-primary">
                    Duración (min)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className={fieldClassName}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-app-primary">
                  Tipo o Nombre de la Prueba
                </label>
                <select
                  value={formTest}
                  onChange={(e) => setFormTest(e.target.value)}
                  className={fieldClassName}
                >
                  <option value="Evaluación Técnica">Evaluación Técnica</option>
                  <option value="Evaluación de Redes e Infraestructura">Evaluación de Redes e Infraestructura</option>
                  <option value="Evaluación Psicolaboral">Evaluación Psicolaboral</option>
                  <option value="Entrevista por Competencias">Entrevista por Competencias</option>
                  <option value="Prueba Práctica de Fibra Óptica">Prueba Práctica de Fibra Óptica</option>
                </select>
              </div>

              {/* Dynamic Criteria Section */}
              <div className="rounded-xl border border-app-border bg-app-muted/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase text-app-primary">Criterios de Evaluación</h4>
                    <p className="text-[11px] text-app-secondary">Define los factores a ponderar y su calificación de 0 a 100.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCriterion}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#D32F2F] hover:text-[#B71C1C] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Criterio
                  </button>
                </div>

                <div className="space-y-3">
                  {criteria.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 rounded-lg border border-app-border bg-app-surface p-3 shadow-sm">
                      <div className="flex-1 min-w-0">
                        <label className="mb-0.5 block text-[10px] font-semibold text-app-secondary">Área / Criterio</label>
                        <input
                          type="text"
                          value={item.area}
                          onChange={(e) => handleCriterionChange(index, "area", e.target.value)}
                          placeholder="Ej. Diagnóstico de empalmes"
                          required
                          className="recruiter-field w-full px-2.5 py-1.5 text-xs"
                        />
                      </div>
                      <div className="w-24">
                        <label className="mb-0.5 block text-[10px] font-semibold text-app-secondary">Peso (%)</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={item.weight}
                          onChange={(e) => handleCriterionChange(index, "weight", e.target.value)}
                          required
                          className="recruiter-field w-full px-2.5 py-1.5 text-center text-xs"
                        />
                      </div>
                      <div className="w-24">
                        <label className="mb-0.5 block text-[10px] font-semibold text-app-secondary">Nota (0-100)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.score}
                          onChange={(e) => handleCriterionChange(index, "score", e.target.value)}
                          required
                          className="recruiter-field w-full px-2.5 py-1.5 text-center text-xs font-bold"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCriterion(index)}
                        disabled={criteria.length <= 1}
                        className="mt-4 p-1.5 text-app-secondary transition-colors hover:text-app-accent disabled:opacity-30"
                        title="Eliminar criterio"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Score Summary Box */}
                <div className="mt-4 flex flex-col justify-between gap-3 rounded-lg border-t border-app-border bg-app-surface p-3 pt-3 sm:flex-row sm:items-center">
                  <div>
                    <span className="text-xs text-app-secondary">Suma de pesos: </span>
                    <span className={`text-xs font-bold ${totalWeight === 100 ? "text-green-600" : "text-amber-600"}`}>
                      {totalWeight}% {totalWeight !== 100 ? "(Sugerido: 100%)" : "✓"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-app-primary">Puntaje Ponderado:</span>
                    <span className={`text-xl font-bold ${computedScore >= 75 ? "text-green-600" : computedScore >= 60 ? "text-yellow-600" : "text-[#D32F2F]"}`}>
                      {computedScore} / 100
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      computedStatus === "aprobado" ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300" : computedStatus === "en_revision" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300" : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                    }`}>
                      {computedStatus === "aprobado" ? "Aprobado" : computedStatus === "en_revision" ? "En Revisión" : "No Aprobado"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-app-border pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-app-secondary transition-colors hover:bg-app-muted hover:text-app-primary"
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
