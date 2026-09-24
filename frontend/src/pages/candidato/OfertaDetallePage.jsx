import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { MapPin, Wallet, Clock3, ArrowLeft, Briefcase } from "lucide-react";
import { getJobs } from "../../utils/jobsData";
import AuthRequiredLink from "../../components/auth/AuthRequiredLink";

export default function OfertaDetallePage() {
  const { id } = useParams();
  const jobs = getJobs();
  const job = useMemo(() => jobs.find((item) => String(item.id) === String(id)), [jobs, id]);

  if (!job) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-gray">Oferta</p>
          <h1 className="mt-3 text-2xl font-bold text-brand-navy">No se encontró la oferta</h1>
          <Link to="/ofertas" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-red px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-red-hover">
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
          <Link to="/ofertas" className="inline-flex items-center gap-2 text-sm font-medium text-brand-gray transition-colors hover:text-brand-navy">
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
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-gray">GTEL Talento</p>
                <h1 className="mt-1 text-3xl font-bold text-brand-navy">{job.title}</h1>
              </div>
            </div>

            <AuthRequiredLink
              to={`/postulacion/${job.id}`}
              className="inline-flex items-center justify-center rounded-xl bg-brand-red px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-red-hover"
            >
              Postular ahora
            </AuthRequiredLink>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
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
                <span className="text-xs font-medium uppercase tracking-[0.18em]">Tipo</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-brand-navy">{job.type}</p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-gray">Descripción</p>
            <p className="mt-3 text-sm leading-7 text-brand-gray">
              Serás parte del equipo GTEL y apoyarás la operación comercial con un enfoque en atención al cliente, metas de calidad y mejora continua. El rol requiere comunicación efectiva, orientación a resultados y capacidad para trabajar en equipo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
