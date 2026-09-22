import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, CalendarDays, Briefcase } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { getRecruiterDashboard } from "../../services/api";

const colors = ["#D32F2F", "#1E293B", "#3B82F6", "#F59E0B"];

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  useEffect(() => { getRecruiterDashboard().then(setDashboard).catch(() => setDashboard(null)); }, []);

  const kpis = [
    ["Postulantes", dashboard?.newApplicants, Users, "bg-blue-50", "text-blue-600"],
    ["Entrevistas programadas", dashboard?.scheduledInterviews, CalendarDays, "bg-green-50", "text-green-600"],
    ["Ofertas activas", dashboard?.activeJobs, Briefcase, "bg-orange-50", "text-orange-600"],
  ];
  const recent = dashboard?.recentApplications || [];
  const areas = dashboard?.applicationsByArea || [];

  return <div className="p-6 space-y-6">
    <div className="flex items-center justify-between"><div><h1 className="text-xl font-bold text-brand-navy">Dashboard</h1><p className="text-sm text-brand-gray">Resumen actualizado desde la base de datos</p></div><Link to="/reclutador/publicar-oferta" className="bg-brand-red text-white px-4 py-2 rounded-lg text-sm font-semibold">+ Publicar Oferta</Link></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{kpis.map(([label, value, Icon, bg, color]) => <div key={label} className="bg-white rounded-xl border border-gray-100 p-5"><div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center mb-3`}><Icon className={`w-5 h-5 ${color}`} /></div><div className="text-3xl font-bold text-brand-navy">{value ?? "—"}</div><div className="text-sm text-brand-navy">{label}</div></div>)}</div>
    <div className="flex flex-col lg:flex-row gap-6"><div className="flex-[7] bg-white rounded-xl border border-gray-100 p-6"><h2 className="font-bold text-brand-navy mb-4">Últimas postulaciones</h2>{recent.length === 0 ? <p className="text-sm text-brand-gray">No hay postulaciones registradas.</p> : <div className="space-y-2">{recent.map((item) => <div key={item.id} className="flex justify-between border-b border-gray-100 py-2 text-sm"><span>{item.name}</span><span className="text-brand-gray">{item.status}</span></div>)}</div>}</div><div className="flex-[3] bg-white rounded-xl border border-gray-100 p-5"><h2 className="font-bold text-brand-navy mb-1">Postulaciones por área</h2>{areas.length === 0 ? <p className="text-sm text-brand-gray py-16 text-center">Sin datos por área.</p> : <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={areas} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80}>{areas.map((area, index) => <Cell key={area.name} fill={area.color || colors[index % colors.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer>}</div></div>
  </div>;
}
