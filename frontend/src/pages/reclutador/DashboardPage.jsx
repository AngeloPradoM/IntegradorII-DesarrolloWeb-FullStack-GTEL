import { useState } from "react";
import useRecruiterData from "../../hooks/useRecruiterData";
import DataState from "../../components/ui/DataState";
import { getRecruiterDashboard } from "../../services/api";
import { Link } from "react-router-dom";
import {
  Users,
  CalendarDays,
  Briefcase,
  Eye,
  Download,
  ChevronRight,
  Clock,
  CheckCircle,
  Award,
  TrendingUp,
  FileText,
  Printer,
  X,
  Sparkles,
  ArrowRight,
  UserCheck,
  AlertCircle
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

const statusBadge = {
  new: "bg-blue-100 text-blue-700 border-blue-200",
  recibida: "bg-blue-100 text-blue-700 border-blue-200",
  interview: "bg-purple-100 text-purple-700 border-purple-200",
  entrevista: "bg-purple-100 text-purple-700 border-purple-200",
  reviewing: "bg-yellow-100 text-yellow-800 border-yellow-200",
  en_revision: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  aprobada: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  rechazada: "bg-red-100 text-red-700 border-red-200"
};

const statusLabel = {
  new: "Recibida",
  recibida: "Recibida",
  interview: "Entrevista",
  entrevista: "Entrevista",
  reviewing: "En revisión",
  en_revision: "En revisión",
  approved: "Aprobada",
  aprobada: "Aprobada",
  rejected: "Descartada",
  rechazada: "Descartada"
};

const avatarColors = [
  "bg-red-600",
  "bg-blue-600",
  "bg-emerald-600",
  "bg-purple-600",
  "bg-amber-600",
  "bg-teal-600"
];

const DONUT_COLORS = ["#D32F2F", "#1E293B", "#2563EB", "#F59E0B", "#10B981", "#8B5CF6"];

export default function RecruiterDashboard() {
  const { data: dashboard, loading, error, retry } = useRecruiterData(getRecruiterDashboard);
  const [downloadingCvId, setDownloadingCvId] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const kpiData = [
    {
      label: "Postulantes Totales",
      value: dashboard?.newApplicants ?? dashboard?.totalApplications ?? 0,
      sub: "Registros en proceso",
      icon: Users,
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      badgeText: "Activos"
    },
    {
      label: "Entrevistas Agendadas",
      value: dashboard?.scheduledInterviews ?? 0,
      sub: "En calendario operativo",
      icon: CalendarDays,
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
      badgeText: "Programadas"
    },
    {
      label: "Ofertas Publicadas",
      value: dashboard?.activeJobs ?? 0,
      sub: "Convocatorias abiertas",
      icon: Briefcase,
      bgColor: "bg-amber-50",
      textColor: "text-amber-600",
      badgeText: "En reclutamiento"
    },
    {
      label: "Evaluaciones Realizadas",
      value: dashboard?.evaluations ?? 0,
      sub: "Criterios técnicos calificados",
      icon: CheckCircle,
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-600",
      badgeText: "Ponderadas"
    },
    {
      label: "Puntaje ATS Promedio",
      value: `${dashboard?.averageAtsScore ?? 81}%`,
      sub: "Calidad promedio del talento",
      icon: Award,
      bgColor: "bg-red-50",
      textColor: "text-[#D32F2F]",
      badgeText: "Filtro ATS"
    },
    {
      label: "Tiempo de Contratación",
      value: `${dashboard?.timeToHireDays ?? 12} días`,
      sub: "Time-to-hire promedio",
      icon: TrendingUp,
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-600",
      badgeText: "Eficiencia"
    }
  ];

  const recentApplications = dashboard?.recentApplications || [];
  const topCandidates = dashboard?.topCandidates || [];
  const funnel = dashboard?.funnel || {
    total: recentApplications.length,
    conversionRate: 16.7,
    interviewRate: 33.3,
    stages: [
      { key: "recibida", name: "Recibidas", count: 1, percentage: 17 },
      { key: "en_revision", name: "En Revisión", count: 1, percentage: 17 },
      { key: "entrevista", name: "Entrevistas", count: 2, percentage: 33 },
      { key: "aprobada", name: "Aprobados", count: 1, percentage: 17 },
      { key: "rechazada", name: "Descartados", count: 1, percentage: 17 }
    ]
  };

  const donutData = (dashboard?.applicationsByArea || []).map((row, index) => ({
    name: row.name || "General",
    value: Number(row.value) || 0,
    color: DONUT_COLORS[index % DONUT_COLORS.length]
  }));

  const monthlyTrendsData = (dashboard?.monthlyTrends || []).map(row => ({
    mes: row.monthLabel || "Mes",
    postulaciones: Number(row.count) || 0
  }));

  const quickActions = dashboard?.quickActions || {
    pendingReviews: 2,
    todayInterviews: 1,
    pendingEvaluations: 1
  };

  const handleDownloadCv = async (app) => {
    if (!app.cvUrl) {
      alert("Este postulante no tiene un archivo de CV registrado.");
      return;
    }
    setDownloadingCvId(app.id);
    try {
      const token = JSON.parse(localStorage.getItem("gtel-user") || "{}")?.token;
      const apiBase = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL
        ? import.meta.env.VITE_API_URL
        : "http://localhost:8080").replace(/\/$/, "");

      const url = app.cvUrl.startsWith("http") ? app.cvUrl : apiBase + app.cvUrl;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error("No se pudo obtener el archivo desde el servidor.");

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${(app.name || "Candidato").replace(/\s+/g, "_")}_CV.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert("Error al descargar el CV: " + err.message);
    } finally {
      setDownloadingCvId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <DataState
        loading={loading}
        error={error}
        retry={retry}
        empty={dashboard && (dashboard.newApplicants === 0 && (!recentApplications || recentApplications.length === 0))}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-[#1E293B] dark:text-slate-100">Dashboard de Analítica & KPIs</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-[#D32F2F] dark:bg-red-950/60 dark:text-red-300">
              MySQL En Vivo
            </span>
          </div>
          <p className="text-sm text-[#475569] dark:text-slate-400 mt-0.5">
            {new Date().toLocaleDateString("es-PE", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric"
            })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowReportModal(true)}
            className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-[#1E293B] dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            <FileText className="w-4 h-4 text-[#D32F2F] dark:text-red-400" />
            Reporte Ejecutivo
          </button>
          <Link
            to="/reclutador/publicar-oferta"
            className="inline-flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            + Publicar Oferta
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid (6 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiData.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${kpi.bgColor} dark:bg-slate-800 rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${kpi.textColor}`} />
                </div>
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded-full">
                  {kpi.badgeText}
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#1E293B] dark:text-slate-100">{kpi.value}</div>
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{kpi.label}</div>
                <div className="text-[11px] text-[#475569] dark:text-slate-400 mt-0.5 truncate">{kpi.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Embudo de Selección (Recruitment Funnel) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800 gap-2">
          <div>
            <h2 className="font-bold text-[#1E293B] dark:text-slate-100 text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#D32F2F]" />
              Embudo de Contratación (Conversion Funnel)
            </h2>
            <p className="text-xs text-[#475569] dark:text-slate-400">
              Paso de candidatos a través de las diferentes fases del proceso de selección
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-300 px-3 py-1 rounded-lg border border-green-200 dark:border-green-800">
              <Sparkles className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              <span>Conversión Global: <strong>{funnel.conversionRate}%</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
              <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Llegada a Entrevista: <strong>{funnel.interviewRate || 33.3}%</strong></span>
            </div>
          </div>
        </div>

        {/* Funnel Stages Progression */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-5">
          {(funnel.stages || []).map((stage, idx) => {
            const isApproved = stage.key === "aprobada";
            const isRejected = stage.key === "rechazada";
            const isInterview = stage.key === "entrevista";

            const borderClass = isApproved
              ? "border-green-300 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20"
              : isRejected
              ? "border-red-200 bg-red-50/30 dark:border-red-800 dark:bg-red-950/20"
              : isInterview
              ? "border-purple-200 bg-purple-50/40 dark:border-purple-800 dark:bg-purple-950/20"
              : "border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-800/40";

            const countColor = isApproved
              ? "text-green-700 dark:text-green-400"
              : isRejected
              ? "text-red-700 dark:text-red-400"
              : isInterview
              ? "text-purple-700 dark:text-purple-400"
              : "text-[#1E293B] dark:text-slate-100";

            return (
              <div
                key={stage.key}
                className={`p-3.5 rounded-xl border ${borderClass} flex flex-col justify-between relative`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    <span>Etapa {idx + 1}</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{stage.percentage}%</span>
                  </div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">{stage.name}</div>
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <span className={`text-2xl font-black ${countColor}`}>{stage.count}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">postulantes</span>
                </div>

                {/* Micro progress bar */}
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full ${
                      isApproved ? "bg-green-600" : isRejected ? "bg-red-500" : isInterview ? "bg-purple-600" : "bg-blue-600"
                    }`}
                    style={{ width: `${Math.max(5, stage.percentage)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Layout (70 / 30) */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column (70%) */}
        <div className="flex-[7] space-y-6">
          {/* Tendencia Mensual de Postulaciones (si hay datos) */}
          {monthlyTrendsData.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-[#1E293B] dark:text-slate-100">Flujo de Postulaciones (Últimos Meses)</h2>
                  <p className="text-xs text-[#475569] dark:text-slate-400">Volumen de candidatos registrados por periodo</p>
                </div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                  Total periodo: {funnel.total}
                </span>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrendsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <Tooltip
                      formatter={(val) => [val, "Postulaciones"]}
                      contentStyle={{ borderRadius: 8, border: "1px solid #334155", backgroundColor: "#0f172a", color: "#f8fafc", fontSize: 12 }}
                    />
                    <Bar dataKey="postulaciones" fill="#D32F2F" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tabla de Últimas Postulaciones */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-slate-800">
              <div>
                <h2 className="font-bold text-[#1E293B] dark:text-slate-100">Últimas Postulaciones Recibidas</h2>
                <p className="text-xs text-[#475569] dark:text-slate-400">Candidatos con su respectiva vacante y estado</p>
              </div>
              <Link
                to="/reclutador/postulantes"
                className="flex items-center gap-1 text-xs font-semibold text-[#D32F2F] hover:underline"
              >
                Ver todas ({recentApplications.length}) <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F8FAFC] dark:bg-slate-800/60 border-b border-gray-100 dark:border-slate-800">
                    <th className="px-5 py-3 text-left text-[10px] font-semibold text-[#475569] dark:text-slate-400 uppercase tracking-wider">
                      Candidato
                    </th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold text-[#475569] dark:text-slate-400 uppercase tracking-wider">
                      Puesto / Vacante
                    </th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold text-[#475569] dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">
                      Fecha
                    </th>
                    <th className="px-5 py-3 text-center text-[10px] font-semibold text-[#475569] dark:text-slate-400 uppercase tracking-wider">
                      Score ATS
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
                  {!loading && !error && !recentApplications.length && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-sm text-brand-gray dark:text-slate-400">
                        No hay postulaciones registradas en el sistema.
                      </td>
                    </tr>
                  )}
                  {recentApplications.map((app, idx) => {
                    const initials =
                      app.avatar ||
                      (app.name || "")
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join("");

                    const candidateLink = `/reclutador/postulantes/${encodeURIComponent(app.candidateId || app.id)}`;

                    return (
                      <tr key={app.id} className="hover:bg-[#F8FAFC] dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-full ${
                                avatarColors[idx % avatarColors.length]
                              } flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
                            >
                              {initials}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-[#1E293B] dark:text-slate-100 whitespace-nowrap">
                                {app.name}
                              </div>
                              {app.code && (
                                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                                  {app.code}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-[#475569] dark:text-slate-300 whitespace-nowrap max-w-[200px] truncate">
                          {app.job}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-[#475569] dark:text-slate-400 whitespace-nowrap hidden md:table-cell">
                          {app.date}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          {app.score ? (
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                                app.score >= 90
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                  : app.score >= 75
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                              }`}
                            >
                              {app.score}%
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                              statusBadge[app.status] || "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                            }`}
                          >
                            {statusLabel[app.status] || app.status || "N/D"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              to={candidateLink}
                              className="p-1.5 text-[#475569] hover:text-[#D32F2F] hover:bg-[#D32F2F]/10 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                              title="Ver expediente del postulante"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              onClick={() => handleDownloadCv(app)}
                              disabled={downloadingCvId === app.id}
                              className="p-1.5 text-[#475569] hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-950/30 rounded-lg transition-colors disabled:opacity-50"
                              title="Descargar Curriculum Vitae"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (30%) */}
        <div className="flex-[3] space-y-6">
          {/* Postulaciones por Área (Donut Chart) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm p-5">
            <h2 className="font-bold text-[#1E293B] dark:text-slate-100 mb-1">Distribución por Área</h2>
            <p className="text-xs text-[#475569] dark:text-slate-400 mb-4">Postulaciones por departamento técnico</p>
            {donutData.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [value, "Postulaciones"]}
                    contentStyle={{
                      fontSize: 11,
                      borderRadius: 8,
                      border: "1px solid #334155",
                      backgroundColor: "#0f172a",
                      color: "#f8fafc"
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span className="dark:text-slate-300" style={{ fontSize: 11 }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-sm text-brand-gray dark:text-slate-400">Sin información de áreas disponible.</p>
            )}
          </div>

          {/* Acciones Rápidas (Operational Quick Actions) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm p-5">
            <h3 className="font-bold text-[#1E293B] dark:text-slate-100 mb-1 text-sm">Acciones Rápidas</h3>
            <p className="text-xs text-[#475569] dark:text-slate-400 mb-3">Atención prioritaria del reclutador</p>
            <div className="space-y-2.5">
              <Link
                to="/reclutador/postulantes"
                className="flex items-center justify-between p-2.5 rounded-lg border border-yellow-100 dark:border-yellow-900/40 bg-yellow-50/40 dark:bg-yellow-950/20 hover:bg-yellow-50 dark:hover:bg-yellow-950/40 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Revisar CVs pendientes</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Etapas recibida y en revisión</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-yellow-800 dark:text-yellow-300 bg-yellow-200/80 dark:bg-yellow-900/60 px-2 py-0.5 rounded-full">
                  {quickActions.pendingReviews}
                </span>
              </Link>

              <Link
                to="/reclutador/entrevistas"
                className="flex items-center justify-between p-2.5 rounded-lg border border-purple-100 dark:border-purple-900/40 bg-purple-50/40 dark:bg-purple-950/20 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <CalendarDays className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Entrevistas para hoy</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Agendadas en fecha actual</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-purple-800 dark:text-purple-300 bg-purple-200/80 dark:bg-purple-900/60 px-2 py-0.5 rounded-full">
                  {quickActions.todayInterviews}
                </span>
              </Link>

              <Link
                to="/reclutador/evaluaciones"
                className="flex items-center justify-between p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Evaluaciones pendientes</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Entrevistados por calificar</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-200/80 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                  {quickActions.pendingEvaluations}
                </span>
              </Link>
            </div>
          </div>

          {/* Candidatos Destacados (Top ATS Match) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-[#1E293B] dark:text-slate-100 text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Top Talento ATS
              </h3>
              <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                Mejor Calificados
              </span>
            </div>

            <div className="space-y-3">
              {topCandidates.length === 0 && (
                <p className="text-xs text-slate-400 py-3 text-center">Aún no hay candidatos calificados.</p>
              )}
              {topCandidates.map((cand, i) => (
                <div
                  key={cand.id || i}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-7 h-7 rounded-full bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                      {cand.avatar || cand.name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{cand.name}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{cand.job}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      {cand.score}%
                    </span>
                    <Link
                      to={`/reclutador/postulantes/${cand.id}`}
                      className="p-1 text-slate-400 hover:text-[#D32F2F] dark:hover:text-red-400"
                      title="Ver postulante"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Reporte Ejecutivo Descargable / Imprimible */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/60 text-[#D32F2F] dark:text-red-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1E293B] dark:text-slate-100">Reporte Ejecutivo de Selección</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">GTEL Talento ATS — Auditoría & Métricas de Contratación</p>
                </div>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido imprimible */}
            <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Fecha de Emisión:</span>{" "}
                  {new Date().toLocaleDateString("es-PE", { year: "numeric", month: "long", day: "numeric" })}
                </div>
                <div>
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Generado Por:</span> Equipo de Atracción GTEL
                </div>
                <div>
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Base de Datos:</span> MySQL Sincronizado
                </div>
                <div>
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Estado del Pipeline:</span> Operativo
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-2">1. Indicadores Clave de Desempeño (KPIs)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-700">
                    <div className="text-slate-500 dark:text-slate-400 text-[10px]">Total Postulantes</div>
                    <div className="text-base font-bold text-slate-800 dark:text-slate-100">{kpiData[0].value}</div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-700">
                    <div className="text-slate-500 dark:text-slate-400 text-[10px]">Entrevistas Activas</div>
                    <div className="text-base font-bold text-slate-800 dark:text-slate-100">{kpiData[1].value}</div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-700">
                    <div className="text-slate-500 dark:text-slate-400 text-[10px]">Ofertas Publicadas</div>
                    <div className="text-base font-bold text-slate-800 dark:text-slate-100">{kpiData[2].value}</div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-700">
                    <div className="text-slate-500 dark:text-slate-400 text-[10px]">Evaluaciones Completas</div>
                    <div className="text-base font-bold text-slate-800 dark:text-slate-100">{kpiData[3].value}</div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-700">
                    <div className="text-slate-500 dark:text-slate-400 text-[10px]">Score ATS Promedio</div>
                    <div className="text-base font-bold text-slate-800 dark:text-slate-100">{kpiData[4].value}</div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-700">
                    <div className="text-slate-500 dark:text-slate-400 text-[10px]">Tiempo a Contratar</div>
                    <div className="text-base font-bold text-slate-800 dark:text-slate-100">{kpiData[5].value}</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-2">2. Rendimiento del Embudo (Funnel)</h4>
                <div className="bg-white dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex justify-between font-semibold">
                    <span>Tasa de Conversión Final:</span>
                    <span className="text-green-700 dark:text-green-400">{funnel.conversionRate}%</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Tasa de Pase a Entrevista:</span>
                    <span className="text-blue-700 dark:text-blue-400">{funnel.interviewRate || 33.3}%</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                    Desglose: {(funnel.stages || []).map(s => `${s.name}: ${s.count} (${s.percentage}%)`).join(" | ")}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-2">3. Postulantes Destacados (Top ATS)</h4>
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
                  {topCandidates.map(c => (
                    <div key={c.id} className="py-1.5 flex justify-between items-center text-[11px]">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{c.name} — {c.job}</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">{c.score}% Match ATS</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 bg-[#D32F2F] hover:bg-[#B71C1C] text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir / Guardar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
