import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { MapPin, Wallet, Clock3, ArrowLeft, Briefcase, Calendar, CheckCircle2, RefreshCw, AlertCircle, Building2 } from "lucide-react";
import { getPublicJob } from "../../services/jobService";
import { getJobs } from "../../utils/jobsData";
import AuthRequiredLink from "../../components/auth/AuthRequiredLink";

export default function OfertaDetallePage() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getPublicJob(id)
      .then(data => {
        if (!active) return;
        if (data) {
          setJob(data);
        } else {
          // Fallback a jobs locales si existieran
          const localFallback = getJobs().find(item => String(item.id) === String(id));
          setJob(localFallback || null);
        }
      })
      .catch(() => {
        if (!active) return;
        const localFallback = getJobs().find(item => String(item.id) === String(id));
        if (localFallback) {
          setJob(localFallback);
        } else {
          setError("No se pudo cargar la oferta laboral solicitada.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <RefreshCw className="w-8 h-8 mx-auto text-brand-red animate-spin mb-3" />
        <p className="text-sm font-medium text-brand-gray">Cargando detalles de la vacante…</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <AlertCircle className="w-10 h-10 mx-auto text-red-500 mb-2" />
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-gray">Oferta Laboral</p>
          <h1 className="mt-2 text-2xl font-bold text-brand-navy">
            {error || "No se encontró la oferta"}
          </h1>
          <p className="mt-1 text-sm text-brand-gray">
            La convocatoria pudo haber expirado o fue retirada temporalmente.
          </p>
          <Link
            to="/ofertas"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-red px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-red-hover"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a ofertas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <Link
            to="/ofertas"
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-gray transition-colors hover:text-brand-navy"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a ofertas
          </Link>
        </div>

        <div className="p-6 md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-red/10 text-brand-red ring-1 ring-brand-red/10">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-brand-gray">GTEL Talento ATS</span>
                  {job.department && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
                      <Building2 className="h-3 w-3" />
                      {job.department}
                    </span>
                  )}
                </div>
                <h1 className="mt-1 text-2xl md:text-3xl font-bold text-brand-navy">{job.title}</h1>
              </div>
            </div>

            <AuthRequiredLink
              to={`/postulacion/${job.id}`}
              className="inline-flex items-center justify-center rounded-xl bg-brand-red px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-red-hover shadow-sm"
            >
              Postular ahora
            </AuthRequiredLink>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-brand-gray">
                <MapPin className="h-4 w-4 text-brand-red" />
                <span className="text-xs font-medium uppercase tracking-[0.18em]">Ubicación</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-brand-navy">{job.location}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-brand-gray">
                <Wallet className="h-4 w-4 text-brand-red" />
                <span className="text-xs font-medium uppercase tracking-[0.18em]">Salario</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-brand-navy">{job.salary}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-brand-gray">
                <Clock3 className="h-4 w-4 text-brand-red" />
                <span className="text-xs font-medium uppercase tracking-[0.18em]">Jornada</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-brand-navy">
                {job.type} {job.modality ? `(${job.modality})` : ""}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-brand-gray">
                <Calendar className="h-4 w-4 text-brand-red" />
                <span className="text-xs font-medium uppercase tracking-[0.18em]">Publicación</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-brand-navy">{job.posted || job.date}</p>
            </div>
          </div>

          {/* Requisitos y detalles si existen */}
          {(job.education || job.experience || (Array.isArray(job.tags) && job.tags.length > 0)) && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-gray mb-3">Requisitos del Puesto</p>
              <div className="grid gap-3 sm:grid-cols-2 text-sm text-[#334155]">
                {job.education && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span><strong>Nivel educativo:</strong> {job.education}</span>
                  </div>
                )}
                {job.experience && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span><strong>Experiencia mínima:</strong> {job.experience}</span>
                  </div>
                )}
                {job.vacancies && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span><strong>Plazas vacantes:</strong> {job.vacancies}</span>
                  </div>
                )}
                {job.deadline && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span><strong>Cierre de postulación:</strong> {job.deadline}</span>
                  </div>
                )}
              </div>

              {Array.isArray(job.tags) && job.tags.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap gap-1.5 items-center">
                  <span className="text-xs text-brand-gray mr-1">Competencias:</span>
                  {job.tags.map(tag => (
                    <span key={tag} className="text-xs bg-white border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-gray">Descripción</p>
            <p className="mt-3 text-sm leading-7 text-slate-700 whitespace-pre-wrap">
              {job.description || "Descripción detallada del puesto no disponible."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
