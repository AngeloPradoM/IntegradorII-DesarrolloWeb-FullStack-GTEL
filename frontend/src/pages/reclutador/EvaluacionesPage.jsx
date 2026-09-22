import { useEffect, useState } from "react";
import { ChevronDown, Filter, BarChart2, Clock, CheckCircle, XCircle } from "lucide-react";
import { getRecruiterEvaluations } from "../../services/api";

const statusConfig = {
  aprobado: { label: "Aprobado", color: "bg-green-100 text-green-700", icon: CheckCircle, bar: "bg-green-500" },
  en_revision: { label: "En revisión", color: "bg-yellow-100 text-yellow-700", icon: Clock, bar: "bg-yellow-500" },
  no_aprobado: { label: "No aprobó", color: "bg-red-100 text-brand-red", icon: XCircle, bar: "bg-brand-red" },
};

export default function EvaluacionesPage() {
  const [evaluations, setEvaluations] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTest, setFilterTest] = useState("all");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    getRecruiterEvaluations().then(setEvaluations).catch(() => setEvaluations([]));
  }, []);

  const filtered = evaluations.filter((evaluation) =>
    (filterStatus === "all" || evaluation.status === filterStatus) &&
    (filterTest === "all" || evaluation.test === filterTest)
  );
  const tests = [...new Set(evaluations.map((evaluation) => evaluation.test))];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-brand-navy">Evaluaciones</h1>
          <p className="text-sm text-brand-gray">Resultados reales de las pruebas de los candidatos</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          ["Aprobados", "aprobado", "text-green-600", "bg-green-50"],
          ["En revisión", "en_revision", "text-yellow-600", "bg-yellow-50"],
          ["No aprobaron", "no_aprobado", "text-brand-red", "bg-red-50"],
        ].map(([label, status, color, bg]) => (
          <div key={status} className={`${bg} rounded-xl p-4 text-center border border-white`}>
            <div className={`text-2xl font-bold ${color}`}>{evaluations.filter((item) => item.status === status).length}</div>
            <div className="text-xs text-brand-gray">{label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)} className="appearance-none pl-9 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-lg">
            <option value="all">Todos los estados</option><option value="aprobado">Aprobados</option><option value="en_revision">En revisión</option><option value="no_aprobado">No aprobados</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <BarChart2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select value={filterTest} onChange={(event) => setFilterTest(event.target.value)} className="appearance-none pl-9 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-lg">
            <option value="all">Todas las pruebas</option>{tests.map((test) => <option key={test} value={test}>{test}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {filtered.length === 0 ? <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-sm text-brand-gray">No hay evaluaciones registradas.</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((evaluation) => {
            const status = statusConfig[evaluation.status] || statusConfig.en_revision;
            const StatusIcon = status.icon;
            const isExpanded = expanded === evaluation.id;
            return <div key={evaluation.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between mb-4">
                <div><div className="text-sm font-bold text-brand-navy">{evaluation.name}</div><div className="text-xs text-brand-gray">{evaluation.job}</div></div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${status.color}`}><StatusIcon className="w-3 h-3" />{status.label}</span>
              </div>
              <div className="bg-brand-bg rounded-lg p-3 mb-3"><div className="text-[10px] font-semibold text-brand-gray uppercase mb-1">{evaluation.test}</div><div className="flex justify-between"><span className="text-2xl font-bold text-brand-navy">{evaluation.score}<small className="text-xs text-brand-gray">/100</small></span><span className="flex items-center gap-1 text-xs text-brand-gray"><Clock className="w-3 h-3" />{evaluation.time}</span></div><div className="mt-2 h-2 bg-gray-200 rounded-full"><div className={`h-full rounded-full ${status.bar}`} style={{ width: `${evaluation.score}%` }} /></div></div>
              <div className="text-[10px] text-brand-gray mb-3">{evaluation.date}</div>
              <button onClick={() => setExpanded(isExpanded ? null : evaluation.id)} className="w-full flex items-center justify-center gap-1.5 border border-gray-200 text-brand-gray py-2 rounded-lg text-xs font-medium">{isExpanded ? "Ocultar" : "Ver detalle"}<ChevronDown className={`w-3 h-3 ${isExpanded ? "rotate-180" : ""}`} /></button>
              {isExpanded && <div className="mt-3 text-xs text-brand-gray">El detalle estará disponible cuando el backend registre los criterios de evaluación.</div>}
            </div>;
          })}
        </div>
      )}
    </div>
  );
}
