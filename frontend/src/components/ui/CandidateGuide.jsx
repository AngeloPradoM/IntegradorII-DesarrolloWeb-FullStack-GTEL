import { Link } from 'react-router-dom';

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
const sectionClass = 'mx-auto max-w-7xl scroll-mt-48 px-4 py-16 sm:px-6 lg:px-8';

export default function CandidateGuide() {
  return <>
    <section id="areas" aria-labelledby="areas-title" className={sectionClass}>
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-brand-red">Encuentra tu área</p>
      <h2 id="areas-title" className="mb-4 text-3xl font-bold text-brand-navy">Áreas de trabajo</h2>
      <p className="mb-8 text-sm text-brand-gray">Conoce los perfiles y consulta las oportunidades disponibles.</p>
      <div className="grid gap-6 md:grid-cols-3">{areas.map(([title, description], index) => <article key={title} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-sm font-bold text-brand-red">0{index + 1}</span>
        <h3 className="my-4 text-lg font-bold text-brand-navy">{title}</h3><p className="mb-6 text-sm leading-relaxed text-brand-gray">{description}</p>
        <Link to="/ofertas" className="text-sm font-semibold text-brand-red hover:underline">Ver ofertas disponibles →</Link>
      </article>)}</div>
    </section>
    <section id="como-postular" aria-labelledby="steps-title" className={`${sectionClass} border-t border-gray-200`}>
      <h2 id="steps-title" className="mb-4 text-3xl font-bold text-brand-navy">Cómo postular</h2>
      <p className="mb-8 text-sm text-brand-gray">Te acompañamos desde la búsqueda hasta el seguimiento.</p>
      <ol className="grid gap-6 md:grid-cols-3">{steps.map(([title, description], index) => <li key={title} className="rounded-r-xl border-l-2 border-brand-red bg-white p-6">
        <span className="text-2xl font-bold text-brand-red">0{index + 1}</span><h3 className="my-4 font-bold text-brand-navy">{title}</h3><p className="text-sm leading-relaxed text-brand-gray">{description}</p>
      </li>)}</ol>
    </section>
    <section id="preguntas" aria-labelledby="faq-title" className={`${sectionClass} max-w-3xl`}>
      <h2 id="faq-title" className="mb-4 text-3xl font-bold text-brand-navy">Preguntas frecuentes</h2>
      <p className="mb-6 text-sm text-brand-gray">Resuelve tus dudas antes de dar el siguiente paso.</p>
      {questions.map(([question, answer]) => <details key={question} className="border-b border-gray-200 py-5">
        <summary className="cursor-pointer font-semibold text-brand-navy">{question}</summary><p className="mt-4 text-sm leading-relaxed text-brand-gray">{answer}</p>
      </details>)}
    </section>
  </>;
}
