import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase,
  CalendarDays,
  CheckCircle,
  ChevronRight,
  Clock,
  Eye,
  MessageSquare,
  Plus,
  XCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getCandidateApplications } from "../../services/api";

const statusMap = {
  recibida: { label: "Recibida", color: "bg-app-muted text-app-body", icon: Clock },
  en_revision: { label: "En revisión", color: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300", icon: Eye },
  entrevista: { label: "Entrevista", color: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300", icon: MessageSquare },
  aprobada: { label: "Aprobado", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300", icon: CheckCircle },
  rechazada: { label: "No avanzó", color: "bg-app-danger-soft text-app-accent", icon: XCircle },
  interview: { label: "Entrevista", color: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300", icon: MessageSquare },
  reviewing: { label: "En revisión", color: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300", icon: Eye },
  rejected: { label: "No avanzó", color: "bg-app-danger-soft text-app-accent", icon: XCircle },
  approved: { label: "Aprobado", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300", icon: CheckCircle },
};

export default function MyApplications() {
  const { user } = useAuth();
  const [result, setResult] = useState({ owner: null, applications: [], error: "" });
  const owner = user.id || user.email;
  const applications = result.owner === owner ? result.applications : [];
  const loading = result.owner !== owner;

  useEffect(() => {
    let active = true;
    Promise.resolve()
      .then(() => getCandidateApplications(user))
      .then(items => {
        if (active) {
          setResult({
            owner,
            applications: items.map(item => ({
              ...item,
              appliedDate: item.date,
              steps: item.steps || [{ label: "Postulación enviada", date: item.date, done: true }],
            })),
            error: "",
          });
        }
      })
      .catch(error => {
        if (active) setResult({ owner, applications: [], error: error.message });
      });
    return () => { active = false; };
  }, [owner, user]);

  const stats = [
    { label: "Total aplicaciones", value: applications.length, color: "text-app-primary" },
    {
      label: "En proceso",
      value: applications.filter(item => !["rejected", "approved", "rechazada", "aprobada"].includes(item.status)).length,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Entrevistas",
      value: applications.filter(item => ["interview", "entrevista"].includes(item.status)).length,
      color: "text-emerald-600 dark:text-emerald-400",
    },
  ];

  return (
    <main className="min-h-screen bg-app-bg px-4 py-8 text-app-primary transition-colors">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-app-primary">Mis Postulaciones</h1>
            <p className="mt-1 text-sm text-app-secondary">Seguimiento de tus aplicaciones activas</p>
          </div>
          <Link to="/ofertas" className="inline-flex items-center gap-2 rounded-lg bg-app-action px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-app-action-hover">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nueva postulación
          </Link>
        </div>

        {loading && <p role="status" className="mb-4 text-sm text-app-secondary">Cargando postulaciones…</p>}
        {!loading && result.error && <p role="alert" className="mb-4 text-red-600 dark:text-red-400">{result.error}</p>}
        {!loading && !result.error && !applications.length && <p className="mb-4 text-app-secondary">Todavía no tienes postulaciones.</p>}

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="Resumen de postulaciones">
          {stats.map(({ label, value, color }) => (
            <article key={label} className="rounded-xl border border-app-border bg-app-surface p-4 text-center shadow-sm">
              <strong className={`block text-2xl font-bold ${color}`}>{value}</strong>
              <span className="mt-0.5 block text-xs text-app-secondary">{label}</span>
            </article>
          ))}
        </section>

        <section className="space-y-5" aria-label="Postulaciones registradas">
          {applications.map(app => (
            <ApplicationCard key={app.id} application={app} />
          ))}
        </section>

        <section className="mt-6 rounded-xl border border-app-border bg-app-surface p-6 text-center shadow-sm">
          <Briefcase className="mx-auto mb-2 h-8 w-8 text-app-border-strong" aria-hidden="true" />
          <h2 className="text-sm font-medium text-app-primary">¿Listo para más oportunidades?</h2>
          <p className="mb-4 mt-1 text-xs text-app-secondary">Explora nuestras ofertas laborales y postula a tu próximo reto profesional.</p>
          <Link to="/ofertas" className="inline-flex items-center gap-2 rounded-lg bg-app-action px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-app-action-hover">
            Explorar ofertas
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </main>
  );
}

function ApplicationCard({ application: app }) {
  const status = statusMap[app.status] || statusMap.recibida;
  const StatusIcon = status.icon;
  const canContact = app.status !== "rejected" && app.status !== "rechazada";

  return (
    <article className="overflow-hidden rounded-xl border border-app-border bg-app-surface shadow-sm">
      <header className="border-b border-app-border p-5">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-app-danger-soft">
              <Briefcase className="h-5 w-5 text-app-accent" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-app-primary">{app.job}</h2>
              <p className="text-xs text-app-secondary">{app.company}</p>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1 text-[10px] text-app-secondary">
                  <CalendarDays className="h-3 w-3" aria-hidden="true" />
                  Aplicado: {app.appliedDate}
                </span>
                <span className="font-mono text-[10px] text-app-secondary">{app.code}</span>
              </div>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${status.color}`}>
            <StatusIcon className="h-3 w-3" aria-hidden="true" />
            {status.label}
          </span>
        </div>
      </header>

      <div className="p-5">
        <div className="relative">
          {app.steps.map((step, index) => (
            <div key={step.label} className="relative flex items-start gap-4">
              {index < app.steps.length - 1 && (
                <span className={`absolute left-3.5 top-7 h-6 w-0.5 ${step.done && !step.rejected ? "bg-app-action" : "bg-app-border"}`} aria-hidden="true" />
              )}
              <span className={`z-10 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 ${step.rejected ? "border-app-accent bg-app-danger-soft" : step.active || step.done ? "border-app-action bg-app-action" : "border-app-border bg-app-surface"}`}>
                {step.rejected ? <XCircle className="h-3.5 w-3.5 text-app-accent" aria-hidden="true" /> : step.done ? <CheckCircle className="h-3.5 w-3.5 text-white" aria-hidden="true" /> : step.active ? <Clock className="h-3.5 w-3.5 text-white" aria-hidden="true" /> : <span className="h-2 w-2 rounded-full bg-app-border-strong" />}
              </span>
              <div className="min-w-0 flex-1 pb-5">
                <div className="flex items-center justify-between gap-3">
                  <span className={`text-xs font-semibold ${step.rejected ? "text-app-accent" : step.active || step.done ? "text-app-primary" : "text-app-secondary"}`}>{step.label}</span>
                  <span className="flex-shrink-0 text-[10px] text-app-secondary">{step.date}</span>
                </div>
                {step.active && (
                  <div className="mt-1.5 rounded-lg border border-app-info-border bg-app-info px-3 py-2">
                    <p className="text-[10px] font-medium text-app-info-icon">Revisa tu correo para conocer las actualizaciones de este proceso.</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {canContact && (
          <div className="flex flex-col gap-2 border-t border-app-border pt-2 sm:flex-row">
            <Link to={`/ofertas/${app.jobId}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-app-border bg-app-surface py-2 text-xs font-medium text-app-body transition-colors hover:bg-app-muted">
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              Ver oferta
            </Link>
            <Link to={`/contactar-reclutador?oferta=${encodeURIComponent(app.job)}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-app-danger-soft py-2 text-xs font-semibold text-app-accent transition-colors hover:bg-app-muted">
              <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
              Contactar reclutador
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
