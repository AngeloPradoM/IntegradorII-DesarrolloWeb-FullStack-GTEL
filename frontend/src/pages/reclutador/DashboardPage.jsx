import useRecruiterData from "../../hooks/useRecruiterData";
import DataState from "../../components/ui/DataState";
import { getRecruiterDashboard } from "../../services/api";
import { Link } from "react-router-dom";
import { Users, CalendarDays, Briefcase, Eye, Download, ChevronRight, Clock, CheckCircle } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
const kpiDesign = [{
  label: "Postulantes",
  icon: Users,
  color: "bg-blue-50",
  iconColor: "text-blue-600",
}, {
  label: "Entrevistas Programadas",
  icon: CalendarDays,
  color: "bg-green-50",
  iconColor: "text-green-600",
}, {
  label: "Ofertas publicadas",
  icon: Briefcase,
  color: "bg-orange-50",
  iconColor: "text-orange-600",
}];
kpiDesign.push({label:"Evaluaciones", icon:CheckCircle, color:"bg-purple-50", iconColor:"text-purple-600"});
const statusBadge = {
  new: "bg-blue-100 text-blue-700",
  interview: "bg-purple-100 text-purple-700",
  reviewing: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-[#D32F2F]"
};
const statusLabel = {
  new: "Nuevo",
  interview: "Entrevista",
  reviewing: "En revisión",
  approved: "Aprobado",
  rejected: "Descartado"
};
const avatarColors = ["bg-[#D32F2F]", "bg-blue-600", "bg-green-600", "bg-purple-600", "bg-orange-600", "bg-teal-600"];
export default function RecruiterDashboard() {
  const {data:dashboard, loading, error, retry} = useRecruiterData(getRecruiterDashboard);
  const kpis = kpiDesign.map((item, index) => ({...item, value:dashboard?.[['newApplicants','scheduledInterviews','activeJobs','evaluations'][index]] ?? '—', sub:'Registros disponibles'}));
  const recentApplications = dashboard?.recentApplications || [];
  const donutData = (dashboard?.applicationsByArea || []).map((row, index) => ({
    ...row,
    color: row.color || ["#D32F2F", "#1E293B", "#3B82F6", "#F59E0B"][index % 4]
  }));
  return <div className="p-6 space-y-6"><DataState loading={loading} error={error} retry={retry} empty={dashboard && kpis.every(item=>item.value===0)} />
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1E293B]">Dashboard</h1>
          <p className="text-sm text-[#475569]">{new Date().toLocaleDateString('es-PE',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
        </div>
        <div className="flex gap-3">
          <Link to="/reclutador/publicar-oferta" className="inline-flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
            + Publicar Oferta
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpis.map(({
        label,
        value,
        icon: Icon,
        color,
        iconColor,
        sub
      }) => <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>

            </div>
            <div className="text-3xl font-bold text-[#1E293B] mb-0.5">{value}</div>
            <div className="text-sm font-medium text-[#1E293B]">{label}</div>
            <div className="text-xs text-[#475569] mt-0.5">{sub}</div>
          </div>)}
      </div>

      {/* Main content: 70/30 */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Últimas postulaciones — 70% */}
        <div className="flex-[7] bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-bold text-[#1E293B]">Últimas Postulaciones</h2>
            <Link to="/reclutador/postulantes" className="flex items-center gap-1 text-xs font-medium text-[#D32F2F] hover:underline">
              Ver todas <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-gray-100">
                  <th className="px-5 py-3 text-left text-[10px] font-semibold text-[#475569] uppercase tracking-wider">Candidato</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold text-[#475569] uppercase tracking-wider">Puesto</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold text-[#475569] uppercase tracking-wider hidden md:table-cell">Fecha</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold text-[#475569] uppercase tracking-wider">Estado</th>
                  <th className="px-5 py-3 text-right text-[10px] font-semibold text-[#475569] uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {!loading && !error && !recentApplications.length && <tr><td colSpan={5} className="p-6 text-center text-sm text-brand-gray">No hay postulantes disponibles.</td></tr>}
                {recentApplications.map((app, idx) => <tr key={app.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                          {app.avatar}
                        </div>
                        <span className="text-sm font-medium text-[#1E293B] whitespace-nowrap">{app.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[#475569] whitespace-nowrap">{app.job}</td>
                    <td className="px-5 py-3.5 text-xs text-[#475569] whitespace-nowrap hidden md:table-cell">{app.date}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${statusBadge[app.status] || 'bg-slate-100 text-slate-600'}`}>
                        {statusLabel[app.status] || 'N/D'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link to={`/reclutador/postulantes/${encodeURIComponent(app.id)}`} className="p-1.5 text-[#475569] hover:text-[#D32F2F] hover:bg-[#D32F2F]/10 rounded-lg transition-colors" title="Ver perfil">
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button disabled className="p-1.5 text-[#475569] hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Descarga de CV pendiente de integración">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </div>

        {/* Donut chart — 30% */}
        <div className="flex-[3] space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-[#1E293B] mb-1">Postulaciones por área</h2>
            <p className="text-xs text-[#475569] mb-4">Distribución de los registros disponibles</p>
            {donutData.length ? <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {donutData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={value => [value, "Postulaciones"]} contentStyle={{
                fontSize: 11,
                borderRadius: 8,
                border: "1px solid #e5e7eb"
              }} />
                <Legend iconType="circle" iconSize={8} formatter={value => <span style={{
                fontSize: 11
              }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer> : <p className="py-12 text-center text-sm text-brand-gray">Sin información de áreas disponible.</p>}
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-[#1E293B] mb-3 text-sm">Acciones rápidas</h3>
            <div className="space-y-2">
              {[{
              label: "Revisar CVs pendientes",
              count: "—",
              icon: Clock,
              color: "text-yellow-600"
            }, {
              label: "Entrevistas de hoy",
              count: "—",
              icon: CalendarDays,
              color: "text-blue-600"
            }, {
              label: "Aprobaciones pendientes",
              count: "—",
              icon: CheckCircle,
              color: "text-green-600"
            }].map(({
              label,
              count,
              icon: Icon,
              color
            }) => <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                    <span className="text-xs text-[#475569]">{label}</span>
                  </div>
                  <span className={`text-xs font-bold ${color}`}>{count}</span>
                </div>)}
            </div>
          </div>
        </div>
      </div>
    </div>;
}
