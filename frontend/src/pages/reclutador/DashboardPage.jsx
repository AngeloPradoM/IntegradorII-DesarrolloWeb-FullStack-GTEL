import { Link } from "react-router-dom";
import { Users, CalendarDays, Briefcase, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { getRecruiterDashboard } from "../../services/api";

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const currentDate = new Intl.DateTimeFormat("es-PE", {
    dateStyle: "full",
  }).format(new Date());

  useEffect(() => {
    getRecruiterDashboard().then(setDashboard).catch(() => setDashboard(null));
  }, []);

  const kpis = [
    { label: "Nuevos Postulantes", value: dashboard?.newApplicants, icon: Users, color: "bg-blue-50", iconColor: "text-blue-600", sub: "esta semana" },
    { label: "Entrevistas Programadas", value: dashboard?.scheduledInterviews, icon: CalendarDays, color: "bg-green-50", iconColor: "text-green-600", sub: "próximos 7 días" },
    { label: "Ofertas Activas", value: dashboard?.activeJobs, icon: Briefcase, color: "bg-orange-50", iconColor: "text-orange-600", sub: "publicadas" },
  ];

  const donutData = dashboard?.applicationsByArea || [];
  const recentApplications = dashboard?.recentApplications || [];
  const quickActions = dashboard?.quickActions || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-brand-navy">Dashboard</h1>
          <p className="text-sm text-brand-gray">{currentDate}</p>
        </div>
        <Link to="/reclutador/publicar-oferta"
          className="inline-flex items-center gap-2 bg-brand-red hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
          + Publicar Oferta
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.map(({ label, value, icon: Icon, color, iconColor, sub }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
            </div>
              <div className="text-3xl font-bold text-brand-navy mb-0.5">{value ?? "—"}</div>
            <div className="text-sm font-medium text-brand-navy">{label}</div>
            <div className="text-xs text-brand-gray mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Layout 70/30 */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-[7] bg-white rounded-xl border border-dashed border-gray-200 shadow-sm p-6 flex items-center justify-center min-h-[260px]">
          <div className="text-center max-w-md">
            <h2 className="font-bold text-brand-navy mb-2">Últimas Postulaciones</h2>
            {recentApplications.length === 0 ? (
              <p className="text-sm text-brand-gray">No hay postulaciones recientes.</p>
            ) : (
              <div className="w-full space-y-2">{recentApplications.map((application) => (
                <div key={application.id} className="flex justify-between border-b border-gray-100 py-2 text-sm">
                  <span className="text-brand-navy">{application.name}</span>
                  <span className="text-brand-gray">{application.status}</span>
                </div>
              ))}</div>
            )}
          </div>
        </div>

        <div className="flex-[3] space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-brand-navy mb-1">Postulaciones por área</h2>
            <p className="text-xs text-brand-gray mb-4">Distribución del mes actual</p>
            {donutData.length === 0 ? <p className="text-sm text-brand-gray py-16 text-center">Sin datos por área.</p> : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {donutData.map((entry, index) => <Cell key={index} fill={entry.color || ["#D32F2F", "#1E293B", "#3B82F6", "#F59E0B"][index % 4]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, "Participación"]} />
                  <Legend iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-brand-navy mb-3 text-sm">Acciones rápidas</h3>
            <div className="space-y-2">
              {quickActions.length === 0 ? <p className="text-sm text-brand-gray">Sin acciones pendientes.</p> : quickActions.map(({ label, count, icon: Icon = Clock, color = "text-brand-gray" }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                    <span className="text-xs text-brand-gray">{label}</span>
                  </div>
                  <span className={`text-xs font-bold ${color}`}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}