import { Link } from "react-router-dom";
import {
  Users, CalendarDays, Briefcase, TrendingUp, TrendingDown, Clock, CheckCircle,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const kpis = [
  { label: "Nuevos Postulantes", value: "147", change: "+12%", trend: "up", icon: Users, color: "bg-blue-50", iconColor: "text-blue-600", sub: "esta semana" },
  { label: "Entrevistas Programadas", value: "24", change: "+5%", trend: "up", icon: CalendarDays, color: "bg-green-50", iconColor: "text-green-600", sub: "próximos 7 días" },
  { label: "Ofertas Activas", value: "8", change: "-2%", trend: "down", icon: Briefcase, color: "bg-orange-50", iconColor: "text-orange-600", sub: "publicadas" },
];

const donutData = [
  { name: "Ventas", value: 45, color: "#D32F2F" },
  { name: "Soporte", value: 25, color: "#1E293B" },
  { name: "Supervisión", value: 18, color: "#3B82F6" },
  { name: "RRHH", value: 12, color: "#F59E0B" },
];

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-brand-navy">Dashboard</h1>
          <p className="text-sm text-brand-gray">Lunes, 19 de Mayo 2026</p>
        </div>
        <Link to="/reclutador/publicar-oferta"
          className="inline-flex items-center gap-2 bg-brand-red hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
          + Publicar Oferta
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.map(({ label, value, change, trend, icon: Icon, color, iconColor, sub }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                trend === "up" ? "bg-green-50 text-green-700" : "bg-red-50 text-brand-red"
              }`}>
                {trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {change}
              </div>
            </div>
            <div className="text-3xl font-bold text-brand-navy mb-0.5">{value}</div>
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
            <p className="text-sm text-brand-gray">
              Esta sección estará disponible más adelante para mostrar los últimos candidatos y sus estados.
            </p>
          </div>
        </div>

        <div className="flex-[3] space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-brand-navy mb-1">Postulaciones por área</h2>
            <p className="text-xs text-brand-gray mb-4">Distribución del mes actual</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {donutData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, "Participación"]}
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                <Legend iconType="circle" iconSize={8} formatter={(value) => <span style={{ fontSize: 11 }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-brand-navy mb-3 text-sm">Acciones rápidas</h3>
            <div className="space-y-2">
              {[
                { label: "Revisar CVs pendientes", count: "23", icon: Clock, color: "text-yellow-600" },
                { label: "Entrevistas de hoy", count: "4", icon: CalendarDays, color: "text-blue-600" },
                { label: "Aprobaciones pendientes", count: "7", icon: CheckCircle, color: "text-green-600" },
              ].map(({ label, count, icon: Icon, color }) => (
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