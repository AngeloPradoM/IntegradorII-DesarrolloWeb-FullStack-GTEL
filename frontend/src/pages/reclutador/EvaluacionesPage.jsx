import useRecruiterData from "../../hooks/useRecruiterData";
import DataState from "../../components/ui/DataState";
import { getRecruiterEvaluations } from "../../services/api";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Download, ChevronDown, Filter, BarChart2, Clock, CheckCircle, XCircle } from "lucide-react";
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
  const {data, loading, error, retry} = useRecruiterData(getRecruiterEvaluations);
  const evaluations = data || [];
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTest, setFilterTest] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const filtered = evaluations.filter(e => {
    const matchStatus = filterStatus === "all" || e.status === filterStatus;
    const matchTest = filterTest === "all" || e.test === filterTest;
    return matchStatus && matchTest;
  });
  const tests = [...new Set(evaluations.map(e => e.test))];
  return <div className="p-6"><DataState loading={loading} error={error} retry={retry} />
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1E293B]">Evaluaciones</h1>
          <p className="text-sm text-[#475569]">Resultados de pruebas de los candidatos</p>
        </div>
        <button disabled title="Crear evaluaciones estará disponible al conectar el servicio" className="inline-flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
          + Nueva Evaluación
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[{
        label: "Aprobados",
        value: loading || error ? "—" : evaluations.filter(e => e.status === "passed").length,
        color: "text-green-600",
        bg: "bg-green-50"
      }, {
        label: "En revisión",
        value: evaluations.filter(e => e.status === "review").length,
        color: "text-yellow-600",
        bg: "bg-yellow-50"
      }, {
        label: "No aprobaron",
        value: evaluations.filter(e => e.status === "failed").length,
        color: "text-[#D32F2F]",
        bg: "bg-red-50"
      }].map(({
        label,
        value,
        color,
        bg
      }) => <div key={label} className={`${bg} rounded-xl p-4 text-center border border-white`}>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-[#475569]">{label}</div>
          </div>)}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="appearance-none pl-9 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]">
            <option value="all">Todos los estados</option>
            <option value="passed">Aprobados</option>
            <option value="review">En revisión</option>
            <option value="failed">No aprobados</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <BarChart2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select value={filterTest} onChange={e => setFilterTest(e.target.value)} className="appearance-none pl-9 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]">
            <option value="all">Todas las pruebas</option>
            {tests.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Evaluation cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {!loading && !error && filtered.length === 0 && <p className="col-span-full rounded-xl border border-gray-100 bg-white p-6 text-sm text-brand-gray">{evaluations.length ? "No hay resultados para estos filtros." : "No hay evaluaciones disponibles."}</p>}{filtered.map(ev => {
        const s = statusConfig[ev.status] || {label:'N/D',color:'bg-slate-100 text-slate-600',icon:Clock,bar:'bg-slate-300'};
        const StatusIcon = s.icon;
        const isExpanded = expanded === ev.id;
        return <div key={ev.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
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
                      <span className={`text-2xl font-bold ${ev.score >= 80 ? "text-green-600" : ev.score >= 65 ? "text-yellow-600" : "text-[#D32F2F]"}`}>{ev.score ?? 'N/D'}</span>
                      <span className="text-xs text-[#475569]">/100</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[#475569]">
                      <Clock className="w-3 h-3" />
                      {ev.time}
                    </div>
                  </div>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${s.bar}`} style={{
                  width: `${ev.score ?? 0}%`
                }} />
                  </div>
                </div>

                {/* Breakdown (expandable) */}
                {isExpanded && <div className="space-y-2 mb-3">
                    {ev.details.map(d => <div key={d.area}>
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-[#475569]">{d.area}</span>
                          <span className={`font-semibold ${d.score >= 80 ? "text-green-600" : d.score >= 65 ? "text-yellow-600" : "text-[#D32F2F]"}`}>{d.score == null ? 'N/D' : `${d.score}%`}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${d.score >= 80 ? "bg-green-500" : d.score >= 65 ? "bg-yellow-500" : "bg-[#D32F2F]"}`} style={{
                    width: `${d.score ?? 0}%`
                  }} />
                        </div>
                      </div>)}
                  </div>}

                <div className="text-[10px] text-[#475569] mb-3">{ev.date}</div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button onClick={() => setExpanded(isExpanded ? null : ev.id)} className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-[#475569] py-2 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">
                    {isExpanded ? "Ocultar" : "Ver detalle"}
                    <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </button>
                  <Link to={ev.candidateId ? `/reclutador/postulantes/${encodeURIComponent(ev.candidateId)}` : "/reclutador/postulantes"} className="flex items-center justify-center gap-1 p-2 border border-gray-200 text-[#475569] rounded-lg hover:text-[#D32F2F] hover:border-[#D32F2F]/30 transition-colors" title="Ver candidato">
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button disabled className="flex items-center justify-center gap-1 p-2 border border-gray-200 text-[#475569] rounded-lg hover:text-blue-600 hover:border-blue-200 transition-colors" title="Descarga de reportes pendiente de integración">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>;
      })}
      </div>
    </div>;
}
