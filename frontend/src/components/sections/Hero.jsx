import { Link } from "react-router-dom";
import { ArrowRight, Search, FileCheck2, MessageCircle } from "lucide-react";

const steps = [
  { icon: Search, title: "Encuentra tu oportunidad", text: "Explora las ofertas según tus intereses." },
  { icon: FileCheck2, title: "Comparte tu experiencia", text: "Completa tu perfil y envía tu postulación." },
  { icon: MessageCircle, title: "Sigamos en contacto", text: "Consulta el avance de cada proceso en tu cuenta." },
];

export default function Hero() {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-brand-bg">
      <div className="grid items-center gap-10 px-6 py-12 sm:px-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16 lg:px-14 lg:py-16">
        <div>
          <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-brand-navy">Personas que conectan personas</p>
          <h1 className="max-w-xl text-4xl font-semibold leading-[1.15] text-brand-navy sm:text-5xl">Tu próximo paso profesional empieza aquí.</h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-brand-gray">Encuentra una oportunidad en GTEL que conecte con lo que sabes hacer y con lo que quieres aprender. Te acompañamos en el proceso.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/ofertas" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-brand-red px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-red-hover">Explorar ofertas <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/mis-postulaciones" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-brand-navy transition-colors hover:bg-white">Ver mis postulaciones</Link>
          </div>
          <p className="mt-5 text-sm text-brand-gray">Explora con calma. Da el siguiente paso cuando estés listo.</p>
        </div>
        <div className="rounded-2xl border border-white bg-white p-6 sm:p-8">
          <p className="mb-7 text-lg font-semibold text-brand-navy">Un proceso claro, paso a paso</p>
          <ol className="space-y-7">
            {steps.map(({ icon: Icon, title, text }, index) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-bg text-brand-navy"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <div><p className="text-sm font-semibold text-brand-navy"><span className="mr-2 text-slate-400">0{index + 1}</span>{title}</p><p className="mt-1 text-sm leading-6 text-brand-gray">{text}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
