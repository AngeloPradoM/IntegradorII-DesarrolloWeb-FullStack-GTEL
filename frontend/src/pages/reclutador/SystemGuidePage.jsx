import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  FileCheck2,
  LifeBuoy,
  ListChecks,
  PlayCircle,
  Trash2,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";

function getYoutubeEmbedUrl(videoUrl) {
  if (!videoUrl) return "";
  try {
    const url = new URL(videoUrl);
    const host = url.hostname.replace(/^www\./, "");
    const videoId = host === "youtu.be"
      ? url.pathname.slice(1).split("/")[0]
      : url.pathname.startsWith("/embed/") || url.pathname.startsWith("/shorts/")
        ? url.pathname.split("/")[2]
        : url.searchParams.get("v");
    return videoId ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}` : "";
  } catch {
    return "";
  }
}

const guideSections = [
  {
    id: "dashboard",
    number: "01",
    title: "Dashboard",
    videoUrl: "https://youtu.be/b_kMbjhQBbE",
    icon: BookOpen,
    summary: "Revisa de un vistazo el estado general de los procesos de reclutamiento.",
    steps: [
      "Consulta los indicadores de postulantes, entrevistas, ofertas y evaluaciones para conocer la carga actual.",
      "Usa los gráficos y el embudo para identificar en qué etapa se concentran las postulaciones.",
      "Revisa las postulaciones recientes y las acciones rápidas; abre el registro correspondiente para continuar el seguimiento.",
      "Usa «Publicar oferta» para iniciar una convocatoria directamente cuando ya tengas la información aprobada.",
    ],
    tip: "Los indicadores resumen la información registrada en el sistema; si una sección aparece vacía, comprueba primero sus filtros y registros.",
  },
  {
    id: "requerimientos",
    number: "02",
    title: "Requerimientos",
    videoUrl: "https://youtu.be/MdQEX9BNPVI",
    icon: FileCheck2,
    summary: "Administra las solicitudes de personal que envían las áreas antes de convertirlas en ofertas.",
    steps: [
      "Revisa el título, departamento, cantidad de vacantes, justificación y observaciones de cada solicitud.",
      "Filtra o identifica las solicitudes pendientes y valida que la necesidad y el perfil estén claros.",
      "Como reclutador, puedes aprobar o rechazar una solicitud pendiente; registra una observación útil para dejar contexto.",
      "Cuando una solicitud esté aprobada, usa «Publicar oferta» para llevar sus datos al formulario de convocatoria y completar lo que falte.",
    ],
    tip: "La aprobación del requerimiento confirma la necesidad de contratación; la oferta se publica como un paso separado.",
  },
  {
    id: "ofertas",
    number: "03",
    title: "Ofertas",
    videoUrl: "https://youtu.be/3VlDrW9sdVI",
    icon: BriefcaseBusiness,
    summary: "Busca y administra las convocatorias registradas por la organización.",
    steps: [
      "Busca por puesto, área o ubicación y usa el filtro de estado para ver ofertas activas, pausadas o cerradas.",
      "Abre «Ver y editar» para consultar el detalle de una oferta y actualizar la información permitida.",
      "Cambia el estado cuando necesites pausar o cerrar una convocatoria; revisa el resultado en la lista.",
      "Usa «Publicar Oferta» para crear una nueva convocatoria.",
    ],
    tip: "Antes de publicar o reactivar una oferta, revisa el puesto, las condiciones laborales, los requisitos y la fecha límite.",
  },
  {
    id: "publicar-oferta",
    number: "04",
    title: "Publicar oferta",
    videoUrl: "https://youtu.be/HGBSe9h8IXc",
    icon: ListChecks,
    summary: "Crea la convocatoria que verán las personas postulantes.",
    steps: [
      "Completa la información básica: título del puesto y departamento o área.",
      "Define las condiciones laborales, como número de vacantes, jornada, modalidad, sede y rango salarial.",
      "Redacta una descripción concreta del puesto e indica formación, experiencia y habilidades requeridas.",
      "Revisa los datos y selecciona «Publicar Oferta» para crearla.",
    ],
    tip: "«Guardar borrador» todavía no está disponible. Para no perder información, completa el formulario y publícalo cuando esté revisado.",
  },
  {
    id: "papelera",
    number: "05",
    title: "Papelera",
    videoUrl: "https://youtu.be/fel8mEPu3bE",
    icon: Trash2,
    summary: "Recupera ofertas eliminadas dentro del plazo de retención.",
    steps: [
      "Busca la oferta y revisa la fecha límite para restaurarla.",
      "Selecciona «Restaurar» para devolverla a la lista de ofertas; se restaura como pausada.",
      "Edita y vuelve a publicar la oferta si debe reabrirse a postulaciones.",
    ],
    tip: "Después de 30 días la oferta y sus postulaciones, CV, entrevistas, evaluaciones e historial asociados se eliminan definitivamente. Las cuentas de candidatos se conservan.",
  },
  {
    id: "postulantes",
    number: "06",
    title: "Postulantes",
    videoUrl: "https://youtu.be/ZZodoHQSf_U",
    icon: UsersRound,
    summary: "Consulta candidatos, encuentra perfiles y actualiza su avance en el proceso.",
    steps: [
      "Busca por nombre o puesto y filtra por estado para localizar postulaciones.",
      "Alterna entre la vista de tablero y la vista de tabla según la forma de trabajo que prefieras.",
      "Abre un perfil para revisar experiencia, educación, habilidades, datos de contacto, puntaje ATS e historial.",
      "Descarga el CV cuando lo necesites y actualiza el estado del candidato usando las acciones disponibles.",
    ],
    tip: "Mantén el estado actualizado después de cada revisión para que el equipo comparta una vista clara del proceso.",
  },
  {
    id: "seleccion",
    number: "07",
    title: "Selección",
    videoUrl: "https://youtu.be/QGrSygWdjTI",
    icon: ClipboardCheck,
    summary: "Gestiona postulaciones, entrevistas y evaluaciones desde un espacio de trabajo unificado.",
    steps: [
      "Busca una postulación y, si hace falta, filtra por oferta.",
      "Selecciona al candidato para consultar su historial y CV y para asociar las siguientes acciones a esa postulación.",
      "Usa las secciones internas para actualizar etapas, registrar entrevistas y cargar evaluaciones.",
      "Guarda cada cambio y verifica el mensaje de confirmación antes de continuar.",
    ],
    tip: "La selección se registra por postulación: confirma que elegiste la oferta correcta antes de cambiar estados o crear una entrevista o evaluación.",
  },
  {
    id: "entrevistas",
    number: "08",
    title: "Entrevistas",
    videoUrl: "https://youtu.be/ihAQVRNmYY8",
    icon: CalendarDays,
    summary: "Organiza las entrevistas y consulta la agenda del equipo.",
    steps: [
      "Navega por el calendario mensual y selecciona el día que quieres revisar.",
      "Programa una entrevista seleccionando la postulación, fecha, hora, duración y modalidad.",
      "Indica el lugar o enlace de videollamada y guarda la entrevista.",
      "Abre una entrevista existente para editarla y actualiza su estado cuando se realice o cancele.",
    ],
    tip: "El calendario evita entrevistas programadas que se superpongan. Verifica fecha, hora y enlace antes de guardar.",
  },
  {
    id: "evaluaciones",
    number: "09",
    title: "Evaluaciones",
    videoUrl: "https://youtu.be/KzaPwc0KrC0",
    icon: ClipboardList,
    summary: "Registra resultados y criterios de evaluación de cada postulante.",
    steps: [
      "Selecciona «Nueva Evaluación» y asocia el registro a la postulación correcta.",
      "Indica el tipo de prueba, los criterios evaluados, el puntaje de cada criterio y las observaciones.",
      "Define el resultado y guarda la evaluación.",
      "Usa los filtros y los indicadores para revisar evaluaciones aprobadas, en revisión o no aprobadas.",
    ],
    tip: "Escribe observaciones concretas y relacionadas con cada criterio para que el resultado sea útil en la decisión de selección.",
  },
  {
    id: "tickets",
    number: "10",
    title: "Solicitar ticket",
    videoUrl: "https://youtu.be/CrA6ajgBuRg",
    icon: LifeBuoy,
    summary: "Reporta incidencias de la plataforma y sigue su atención por el equipo técnico.",
    steps: [
      "Asigna un título y selecciona la categoría y subcategoría que mejor describan el problema.",
      "Elige la prioridad y explica por qué es urgente o cómo afecta al trabajo.",
      "Describe los pasos que realizaste, qué esperabas que ocurriera y qué ocurrió en realidad.",
      "Envía el ticket y consulta «Mis solicitudes» para seguir el estado y el código de atención.",
    ],
    tip: "No incluyas contraseñas ni datos personales innecesarios en la descripción del ticket.",
  },
];

const workflow = [
  "Revisar o aprobar el requerimiento",
  "Publicar la oferta",
  "Revisar postulantes y actualizar etapas",
  "Programar entrevistas y registrar evaluaciones",
  "Cerrar el proceso y mantener el historial al día", 
];

export default function SystemGuidePage() {
  return (
    <main aria-label="Guía de uso del sistema" className="min-h-full bg-app-bg p-4 text-app-primary sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#102B4E] to-[#1E293B] p-6 text-white shadow-sm sm:p-8">
          <div className="flex items-start gap-4">
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 sm:flex">
              <BookOpen className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-red-200">Centro de ayuda · Reclutamiento</p>
              <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Guía de uso para el reclutador</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200 sm:text-base">
                Conoce para qué sirve cada apartado y cómo completar las tareas habituales del proceso de selección.
                Puedes volver a esta guía desde el menú lateral cuando lo necesites.
              </p>
            </div>
          </div>
        </header>

        <section aria-labelledby="video-guide-title" className="rounded-2xl border border-dashed border-app-border-strong bg-app-surface p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-app-danger-soft text-app-accent">
                <PlayCircle className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 id="video-guide-title" className="font-bold text-app-primary">Video tutorial</h2>
                <p className="mt-1 text-sm text-app-secondary">Cada apartado tiene su propio espacio para un video que se reproduce aquí mismo.</p>
              </div>
            </div>
            <span className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-app-border px-4 py-3 text-sm font-semibold text-app-secondary">
              <PlayCircle className="h-4 w-4 text-app-accent" aria-hidden="true" /> Reproductor integrado por apartado
            </span>
          </div>
        </section>

        <section aria-labelledby="workflow-title" className="rounded-2xl border border-app-border bg-app-surface p-5 sm:p-6">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-wide text-app-accent">Ruta sugerida</p>
            <h2 id="workflow-title" className="mt-1 text-lg font-bold text-app-primary">Del requerimiento a la contratación</h2>
          </div>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {workflow.map((step, index) => (
              <li key={step} className="flex gap-3 rounded-xl bg-app-muted p-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-red text-xs font-bold text-white">{index + 1}</span>
                <span className="text-sm font-medium leading-5 text-app-body">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <nav aria-label="Índice de la guía" className="rounded-2xl border border-app-border bg-app-surface p-5">
          <h2 className="mb-3 text-sm font-bold text-app-primary">Ir a un apartado</h2>
          <div className="flex flex-wrap gap-2">
            {guideSections.map(({ id, number, title }) => (
              <a key={id} href={`#${id}`} className="rounded-full border border-app-border px-3 py-1.5 text-xs font-semibold text-app-body transition hover:border-brand-red hover:text-app-accent">
                {number}. {title}
              </a>
            ))}
          </div>
        </nav>

        <div className="grid gap-4 lg:grid-cols-2">
          {guideSections.map(({ id, number, title, icon: Icon, summary, steps, tip, videoUrl }) => {
            const embedUrl = getYoutubeEmbedUrl(videoUrl);
            return (
            <section key={id} id={id} aria-labelledby={`${id}-title`} className="scroll-mt-6 rounded-2xl border border-app-border bg-app-surface p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-app-muted text-app-accent">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-bold tracking-wide text-app-accent">APARTADO {number}</p>
                  <h2 id={`${id}-title`} className="mt-0.5 text-lg font-bold text-app-primary">{title}</h2>
                  <p className="mt-1 text-sm leading-5 text-app-secondary">{summary}</p>
                </div>
              </div>
              <ol className="mt-5 space-y-3">
                {steps.map((step, index) => (
                  <li key={step} className="flex gap-3 text-sm leading-5 text-app-body">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-app-danger-soft text-[11px] font-bold text-app-accent">{index + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-5">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-app-secondary">Video del apartado</p>
                <div className="aspect-video overflow-hidden rounded-xl border border-app-border-strong bg-slate-950">
                  {embedUrl ? (
                    <iframe
                      className="h-full w-full"
                      src={embedUrl}
                      title={`Video tutorial: ${title}`}
                      loading="lazy"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-sm text-slate-300">
                      <PlayCircle className="h-8 w-8 text-red-400" aria-hidden="true" />
                      <span>Espacio reservado para el video de {title}</span>
                      <span className="text-xs text-slate-400">Agrega la URL en videoUrl dentro de este apartado de la guía.</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-5 flex gap-2 rounded-xl border border-app-info-border bg-app-info p-3 text-xs leading-5 text-app-body">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-app-info-icon" aria-hidden="true" />
                <p><strong>Recomendación:</strong> {tip}</p>
              </div>
            </section>
            );
          })}
        </div>

        <footer className="flex flex-col gap-3 rounded-2xl bg-app-muted p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-app-primary">¿Listo para continuar?</h2>
            <p className="mt-1 text-sm text-app-secondary">Vuelve al Dashboard para revisar tus procesos pendientes.</p>
          </div>
          <Link to="/reclutador/dashboard" className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-red px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700">
            Ir al Dashboard <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </footer>
      </div>
    </main>
  );
}
