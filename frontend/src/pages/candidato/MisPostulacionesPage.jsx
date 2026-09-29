import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getCandidateApplications } from "../../services/api";
import { Link } from "react-router-dom";
import { CheckCircle, Clock, Eye, MessageSquare, XCircle, Briefcase, CalendarDays, ChevronRight, Plus } from "lucide-react";
const statusMap = {
  recibida: { label:"Recibida", color:"bg-slate-100 text-slate-700", icon:Clock },
  interview: {
    label: "Entrevista",
    color: "bg-blue-100 text-blue-700",
    icon: MessageSquare
  },
  reviewing: {
    label: "En revisión",
    color: "bg-yellow-100 text-yellow-700",
    icon: Eye
  },
  rejected: {
    label: "No avanzó",
    color: "bg-red-100 text-[#D32F2F]",
    icon: XCircle
  },
  approved: {
    label: "Aprobado",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle
  }
};
export default function MyApplications() {
  const { user } = useAuth();
  const [result, setResult] = useState({ owner:null, applications:[], error:'' });
  const owner = user.id || user.email;
  const applications = result.owner === owner ? result.applications : [];
  const loading = result.owner !== owner;
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => getCandidateApplications(user)).then(items => {
      if (active) setResult({ owner, applications:items.map(item => ({ ...item, appliedDate:item.date, steps:item.steps || [{label:'Postulación enviada',date:item.date,done:true}] })), error:'' });
    }).catch(error => { if (active) setResult({ owner, applications:[], error:error.message }); });
    return () => { active = false; };
  }, [owner, user]);
  return <div className="min-h-screen bg-[#F8FAFC] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1E293B]">Mis Postulaciones</h1>
            <p className="text-sm text-[#475569] mt-1">Seguimiento de tus aplicaciones activas</p>
          </div>
          <Link to="/ofertas" className="inline-flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" />
            Nueva postulación
          </Link>
        </div>

        {loading && <p role="status">Cargando postulaciones…</p>}
        {!loading && result.error && <p role="alert" className="mb-4 text-red-600">{result.error}</p>}
        {!loading && !result.error && !applications.length && <p className="mb-4 text-brand-gray">Todavía no tienes postulaciones.</p>}
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[{
          label: "Total aplicaciones",
          value: applications.length,
          color: "text-[#1E293B]"
        }, {
          label: "En proceso",
          value: applications.filter(item => !['rejected','approved'].includes(item.status)).length,
          color: "text-blue-600"
        }, {
          label: "Entrevistas",
          value: applications.filter(item => item.status === 'interview').length,
          color: "text-green-600"
        }].map(({
          label,
          value,
          color
        }) => <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-[#475569] mt-0.5">{label}</div>
            </div>)}
        </div>

        {/* Application cards with timelines */}
        <div className="space-y-5">
          {applications.map(app => {
          const status = statusMap[app.status] || statusMap.recibida;
          const StatusIcon = status.icon;
          return <div key={app.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Card header */}
                <div className="p-5 border-b border-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-[#D32F2F]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-5 h-5 text-[#D32F2F]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#1E293B] text-sm">{app.job}</h3>
                        <p className="text-xs text-[#475569]">{app.company}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-[10px] text-[#475569]">
                            <CalendarDays className="w-3 h-3" />
                            Aplicado: {app.appliedDate}
                          </span>
                          <span className="text-[10px] font-mono text-[#475569]">{app.code}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold ${status.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </div>
                </div>

                {/* Timeline */}
                <div className="p-5">
                  <div className="relative">
                    {app.steps.map((step, idx) => <div key={step.label} className="flex items-start gap-4 relative">
                        {/* Connector line */}
                        {idx < app.steps.length - 1 && <div className={`absolute left-3.5 top-7 w-0.5 h-6 ${step.done && !step.rejected ? "bg-[#D32F2F]" : "bg-gray-200"}`} />}

                        {/* Dot */}
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 z-10 ${step.rejected ? "bg-red-50 border-[#D32F2F]" : step.active ? "bg-[#D32F2F] border-[#D32F2F]" : step.done ? "bg-[#D32F2F] border-[#D32F2F]" : "bg-white border-gray-200"}`}>
                          {step.rejected ? <XCircle className="w-3.5 h-3.5 text-[#D32F2F]" /> : step.done ? <CheckCircle className="w-3.5 h-3.5 text-white" /> : step.active ? <Clock className="w-3.5 h-3.5 text-white" /> : <div className="w-2 h-2 bg-gray-200 rounded-full" />}
                        </div>

                        {/* Content */}
                        <div className="flex-1 pb-5">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-semibold ${step.rejected ? "text-[#D32F2F]" : step.active ? "text-[#1E293B]" : step.done ? "text-[#1E293B]" : "text-gray-400"}`}>
                              {step.label}
                            </span>
                            <span className="text-[10px] text-[#475569]">{step.date}</span>
                          </div>
                          {step.active && <div className="mt-1.5 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                              <p className="text-[10px] text-blue-700 font-medium">
                                Revisa tu correo para conocer las actualizaciones de este proceso.
                              </p>
                            </div>}
                        </div>
                      </div>)}
                  </div>

                  {app.status !== "rejected" && <div className="flex gap-2 pt-2 border-t border-gray-50">
                      <Link to={`/ofertas/${app.jobId}`} className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-[#475569] py-2 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                        Ver oferta
                      </Link>
                      <Link to={`/contactar-reclutador?oferta=${encodeURIComponent(app.job)}`} className="flex-1 flex items-center justify-center gap-1.5 bg-[#D32F2F]/10 text-[#D32F2F] py-2 rounded-lg text-xs font-semibold hover:bg-[#D32F2F]/20 transition-colors">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Contactar reclutador
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>}
                </div>
              </div>;
        })}
        </div>

        {/* Empty state note */}
        <div className="mt-6 bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center">
          <Briefcase className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-[#1E293B]">¿Listo para más oportunidades?</p>
          <p className="text-xs text-[#475569] mt-1 mb-4">Explora nuestras ofertas laborales y postula a tu próximo reto profesional.</p>
          <Link to="/ofertas" className="inline-flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors">
            Explorar ofertas
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>;
}
