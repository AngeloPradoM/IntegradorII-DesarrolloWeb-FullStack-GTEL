import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

const areas = [
  ['Ventas y atención', 'Para quienes disfrutan escuchar, comunicar y ayudar a encontrar soluciones.'],
  ['Soporte técnico', 'Para perfiles interesados en la tecnología y la resolución de problemas.'],
  ['Operaciones y gestión', 'Para quienes buscan organizar, coordinar y mejorar procesos.'],
];
const steps = [
  ['Explora una oferta', 'Revisa las funciones, la ubicación y los requisitos del puesto.'],
  ['Completa tu postulación', 'Inicia sesión, revisa tus datos y adjunta tu CV.'],
  ['Consulta tu avance', 'Entra a Mis postulaciones para consultar el estado de tu solicitud.'],
];
const questions = [
  ['¿Necesito una cuenta para postular?', 'Puedes explorar las ofertas sin registrarte. Para enviar una postulación debes iniciar sesión.'],
  ['¿Dónde consulto mis postulaciones?', 'Desde Mis postulaciones en el encabezado, después de iniciar sesión con tu cuenta.'],
  ['¿Puedo actualizar mis datos de contacto?', 'Sí. Abre el menú de tu perfil y selecciona Editar perfil para revisar tus datos.'],
];
const sectionClass = 'mx-auto max-w-7xl scroll-mt-48 px-4 py-16 sm:px-6 sm:py-20 lg:px-8';

export default function CandidateGuide() {
  return <>
    <section id="areas" aria-labelledby="areas-title" className={sectionClass}>
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-app-accent">Encuentra tu área</p>
      <h2 id="areas-title" className="mb-4 text-3xl font-bold text-app-primary">Áreas de trabajo</h2>
      <p className="mb-8 text-sm text-app-secondary">Conoce los perfiles y consulta las oportunidades disponibles.</p>
      <div className="grid gap-6 md:grid-cols-3">{areas.map(([title, description], index) => <article key={title} className="rounded-2xl border border-app-border bg-app-surface p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-app-danger-soft text-sm font-bold text-app-accent">0{index + 1}</span>
        <h3 className="my-4 text-lg font-bold text-app-primary">{title}</h3><p className="mb-6 text-sm leading-relaxed text-app-body">{description}</p>
        <Link to="/ofertas" className="text-sm font-semibold text-app-accent underline-offset-4 hover:underline">Ver ofertas disponibles →</Link>
      </article>)}</div>
    </section>
    <section id="como-postular" aria-labelledby="steps-title" className={`${sectionClass} border-t border-app-border`}>
      <h2 id="steps-title" className="mb-4 text-3xl font-bold text-app-primary">Cómo postular</h2>
      <p className="mb-8 text-sm text-app-secondary">Te acompañamos desde la búsqueda hasta el seguimiento.</p>
      <ol className="grid gap-6 md:grid-cols-3">{steps.map(([title, description], index) => <li key={title} className="rounded-xl border border-app-border border-l-2 border-l-app-action bg-app-surface p-6 shadow-sm">
        <span className="text-2xl font-bold text-app-accent">0{index + 1}</span><h3 className="my-4 font-bold text-app-primary">{title}</h3><p className="text-sm leading-relaxed text-app-body">{description}</p>
      </li>)}</ol>
    </section>
    <section id="preguntas" aria-labelledby="faq-title" className={`${sectionClass} max-w-3xl`}>
      <h2 id="faq-title" className="mb-4 text-3xl font-bold text-app-primary">Preguntas frecuentes</h2>
      <p className="mb-6 text-sm text-app-secondary">Resuelve tus dudas antes de dar el siguiente paso.</p>
      <div className="space-y-3">{questions.map(([question, answer]) => <details key={question} className="group rounded-xl border border-app-border bg-app-surface shadow-sm transition-colors hover:border-app-border-strong">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-5 py-4 font-semibold text-app-primary marker:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"><span>{question}</span><ChevronDown className="h-5 w-5 shrink-0 text-app-accent transition-transform duration-200 group-open:rotate-180" aria-hidden="true" /></summary><p className="px-5 pb-5 text-sm leading-relaxed text-app-body">{answer}</p>
      </details>)}</div>
    </section>
  </>;
}
