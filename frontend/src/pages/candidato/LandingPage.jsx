import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import CandidateGuide from "../../components/ui/CandidateGuide";
import { Phone, Wifi, Users, Award, Clock, MapPin, Shield, TrendingUp, Star, ChevronRight, Mail, MessageSquare, CheckCircle } from "lucide-react";
export default function LandingPage() {
  const { hash, key } = useLocation();
  useEffect(() => {
    if (!['#areas', '#como-postular', '#preguntas'].includes(hash)) return;
    const frame = requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' }));
    return () => cancelAnimationFrame(frame);
  }, [hash, key]);
  return <div className="overflow-x-clip bg-app-bg font-['Inter',sans-serif] text-app-primary transition-colors duration-200">
      {/* HERO SECTION */}
      <section className="relative bg-[#1E293B] text-white overflow-hidden min-h-[560px] flex items-center">
        <div className="absolute inset-0 bg-cover bg-center" style={{
        backgroundImage: `url(https://images.unsplash.com/photo-1712159018726-4564d92f3ec2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1400)`
      }} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1E293B]/95 via-[#1E293B]/80 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-400/40 bg-red-500/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-red-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
              Oportunidades abiertas ahora
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-5">
              Únete a <span className="text-red-400">GTEL</span> y<br />
              transforma tu carrera
            </h1>
            <p className="text-white/70 text-base leading-relaxed mb-8 max-w-md">
              Somos el call center líder en telecomunicaciones del país. Buscamos personas apasionadas que quieran crecer con nosotros.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/ofertas" className="inline-flex items-center gap-2 rounded-lg bg-app-action px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-app-action-hover hover:shadow-lg hover:shadow-red-700/30">
                Ver Empleos Disponibles
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-2 border-t border-white/10 pt-6 sm:gap-6">
              {[["500+", "Empleados"], ["98%", "Satisfacción"], ["12", "Años de experiencia"]].map(([val, lbl]) => <div key={lbl}>
                  <div className="text-xl font-bold text-red-400">{val}</div>
                  <div className="text-xs text-white/50">{lbl}</div>
                </div>)}
            </div>
          </div>
        </div>
      </section>

      {/* TRABAJA CON NOSOTROS - 50/50 */}
      <section className="mx-auto max-w-7xl bg-app-bg px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1">
            <div className="mb-4 inline-block rounded-full bg-app-danger-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-app-accent">
              Trabaja con nosotros
            </div>
            <h2 className="mb-5 text-3xl font-bold leading-tight text-app-primary">
              Construye el futuro de las<br />telecomunicaciones
            </h2>
            <p className="mb-6 leading-relaxed text-app-body">
              En GTEL Talento creemos que las personas son el corazón de la empresa. Ofrecemos un ambiente de trabajo dinámico, oportunidades reales de crecimiento y beneficios competitivos que marcan la diferencia.
            </p>
            <ul className="space-y-3 mb-8">
              {["Crecimiento profesional acelerado", "Capacitación continua y certificaciones", "Beneficios de salud para ti y tu familia", "Trabajo híbrido y horarios flexibles"].map(item => <li key={item} className="flex items-center gap-3 text-sm text-app-body">
                  <CheckCircle className="h-4 w-4 flex-shrink-0 text-app-accent" />
                  {item}
                </li>)}
            </ul>
            <Link to="/ofertas" className="inline-flex items-center gap-2 rounded-lg bg-app-action px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-app-action-hover">
              Explorar Oportunidades
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex flex-1 justify-center">
            <div className="relative w-full max-w-sm px-3 sm:px-0">
              <img src="https://images.unsplash.com/photo-1766066014237-00645c74e9c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500" alt="GTEL team member" className="w-full max-w-sm rounded-2xl object-cover shadow-2xl" style={{
              aspectRatio: "4/5"
            }} />
              <div className="absolute bottom-4 left-0 flex items-center gap-3 rounded-xl border border-app-border bg-app-surface p-4 shadow-xl sm:-bottom-5 sm:-left-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-app-danger-soft">
                  <TrendingUp className="h-5 w-5 text-app-accent" />
                </div>
                <div>
                  <div className="text-xs text-app-secondary">Vacantes este mes</div>
                  <div className="text-base font-bold text-app-primary">+24 posiciones</div>
                </div>
              </div>
              <div className="absolute right-0 top-4 rounded-xl bg-app-action px-4 py-2 text-white shadow-lg sm:-right-4 sm:-top-4">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-white" />
                  <span className="text-sm font-bold">4.8</span>
                </div>
                <div className="text-[10px] text-white/80">Empleados satisfechos</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INFORMACIÓN CLAVE - 3 columns */}
      <section className="border-y border-app-border bg-app-surface py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="mb-3 inline-block rounded-full bg-app-danger-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-app-accent">
              ¿Por qué elegirnos?
            </div>
            <h2 className="text-3xl font-bold text-app-primary">Información Clave</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-app-secondary">
              Todo lo que necesitas saber para dar el siguiente paso en tu carrera profesional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[{
            icon: Clock,
            title: "Horarios Flexibles",
            desc: "Turnos de mañana, tarde y noche. Modalidad híbrida disponible para muchos roles. Adaptamos tu jornada a tu vida.",
            color: "bg-blue-50 dark:bg-blue-950/40",
            iconColor: "text-blue-600 dark:text-blue-400"
          }, {
            icon: Award,
            title: "Salarios Competitivos",
            desc: "Remuneración acorde al mercado, bonificaciones por desempeño y comisiones. Tu esfuerzo tiene recompensa real.",
            color: "bg-app-danger-soft",
            iconColor: "text-app-accent"
          }, {
            icon: Users,
            title: "Cultura Inclusiva",
            desc: "Somos una empresa diversa e incluyente. Más de 40 nacionalidades trabajan con nosotros en un ambiente de respeto.",
            color: "bg-green-50 dark:bg-green-950/40",
            iconColor: "text-green-600 dark:text-green-400"
          }, {
            icon: TrendingUp,
            title: "Plan de Carrera",
            desc: "El 80% de nuestros líderes comenzaron en posiciones de entrada. Creemos en el talento interno.",
            color: "bg-purple-50 dark:bg-purple-950/40",
            iconColor: "text-purple-600 dark:text-purple-400"
          }, {
            icon: Wifi,
            title: "Tecnología de Punta",
            desc: "Trabajamos con las mejores herramientas y plataformas tecnológicas del sector telecomunicaciones.",
            color: "bg-orange-50 dark:bg-orange-950/40",
            iconColor: "text-orange-600 dark:text-orange-400"
          }, {
            icon: MapPin,
            title: "Múltiples Ubicaciones",
            desc: "Sedes en Lima, Arequipa y Trujillo. Encuentra la posición más cercana a donde vives.",
            color: "bg-teal-50 dark:bg-teal-950/40",
            iconColor: "text-teal-600 dark:text-teal-400"
          }].map(({
            icon: Icon,
            title,
            desc,
            color,
            iconColor
          }) => <div key={title} className="group rounded-xl border border-app-border bg-app-surface p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-6 h-6 ${iconColor}`} />
                </div>
                <h3 className="mb-2 font-bold text-app-primary">{title}</h3>
                <p className="text-sm leading-relaxed text-app-body">{desc}</p>
              </div>)}
          </div>
        </div>
      </section>

      <CandidateGuide />

      {/* TESTIMONIOS */}
      <section className="border-y border-app-border bg-app-muted py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-app-primary">Lo que dicen nuestros colaboradores</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[{
            name: "Carlos Mendoza",
            role: "Agente Senior, Lima",
            text: "Entré como agente hace 3 años y hoy lidero un equipo de 15 personas. GTEL cumple sus promesas.",
            stars: 5
          }, {
            name: "María Torres",
            role: "Supervisora de Ventas",
            text: "El ambiente de trabajo es increíble. Siempre hay apoyo de los compañeros y los jefes son accesibles.",
            stars: 5
          }, {
            name: "Luis Flores",
            role: "Especialista Técnico",
            text: "Las capacitaciones son de primera calidad y los beneficios de salud cubrieron a toda mi familia.",
            stars: 4
          }].map(({
            name,
            role,
            text,
            stars
          }) => <div key={name} className="rounded-xl border border-app-border bg-app-surface p-6 shadow-sm">
                <div className="flex mb-3">
                  {Array.from({
                length: stars
              }).map((_, i) => <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="mb-4 text-sm leading-relaxed text-app-body">"{text}"</p>
                <div>
                  <div className="text-sm font-semibold text-app-primary">{name}</div>
                  <div className="text-xs text-app-secondary">{role}</div>
                </div>
              </div>)}
          </div>
        </div>
      </section>

      {/* CONTACT FORM */}
      <section className="bg-app-surface py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <div className="mb-3 inline-block rounded-full bg-app-danger-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-app-accent">
                Contáctanos
              </div>
              <h2 className="text-3xl font-bold text-app-primary">¿Tienes alguna duda?</h2>
              <p className="mt-2 text-sm text-app-secondary">Escríbenos y un reclutador te responderá en menos de 24 horas.</p>
            </div>

            <form className="space-y-4 rounded-2xl border border-app-border bg-app-muted p-5 shadow-sm sm:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-app-primary">Nombre completo</label>
                  <input type="text" placeholder="Tu nombre" className="w-full rounded-lg border border-app-border-strong bg-app-surface px-3.5 py-2.5 text-sm text-app-primary placeholder:text-app-secondary focus:border-app-action focus:outline-none focus:ring-2 focus:ring-red-500/20" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-app-primary">Correo electrónico</label>
                  <input type="email" placeholder="tu@correo.com" className="w-full rounded-lg border border-app-border-strong bg-app-surface px-3.5 py-2.5 text-sm text-app-primary placeholder:text-app-secondary focus:border-app-action focus:outline-none focus:ring-2 focus:ring-red-500/20" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-app-primary">Mensaje</label>
                <textarea rows={4} placeholder="¿En qué podemos ayudarte?" className="w-full resize-none rounded-lg border border-app-border-strong bg-app-surface px-3.5 py-2.5 text-sm text-app-primary placeholder:text-app-secondary focus:border-app-action focus:outline-none focus:ring-2 focus:ring-red-500/20" />
              </div>
              <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-app-action py-3 text-sm font-semibold text-white transition-colors hover:bg-app-action-hover">
                <MessageSquare className="w-4 h-4" />
                Enviar Mensaje
              </button>
            </form>

            <div className="flex flex-wrap justify-center gap-6 mt-8">
              {[{
              icon: Phone,
              text: "(01) 800-4835"
            }, {
              icon: Mail,
              text: "talento@gtel.com.pe"
            }, {
              icon: MapPin,
              text: "Av. Javier Prado 1500, Lima"
            }].map(({
              icon: Icon,
              text
            }) => <div key={text} className="flex items-center gap-2 text-sm text-app-secondary">
                  <Icon className="h-4 w-4 text-app-accent" />
                  {text}
                </div>)}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-700 bg-[#1E293B] py-12 text-white dark:bg-[#0F172A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-app-action">
                  <Phone className="w-4 h-4" />
                </div>
                <span className="font-bold">GTEL Talento</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-300">
                Plataforma oficial de reclutamiento de GTEL Telecomunicaciones S.A.C.
              </p>
            </div>
            {[{
            title: "Candidatos",
            links: ["Ver Ofertas", "Mis Postulaciones", "Crear Perfil", "Consejos CV"]
          }, {
            title: "Empresa",
            links: ["Acerca de GTEL", "Noticias", "Blog Laboral", "RSE"]
          }, {
            title: "Legal",
            links: ["Privacidad", "Términos de Uso", "Política de Cookies", "Contacto"]
          }].map(({
            title,
            links
          }) => <div key={title}>
                <h4 className="text-sm font-semibold mb-4">{title}</h4>
                <ul className="space-y-2">
                  {links.map(link => <li key={link}>
                      <Link to={({"Ver Ofertas":"/ofertas","Mis Postulaciones":"/mis-postulaciones","Crear Perfil":"/login?registro=1"})[link] || "/"} className="text-xs text-slate-300 transition-colors hover:text-white">{link}</Link>
                    </li>)}
                </ul>
              </div>)}
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-300">© 2026 GTEL Telecomunicaciones. Todos los derechos reservados.</p>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Shield className="w-3 h-3" />
              Datos protegidos bajo Ley 29733
            </div>
          </div>
        </div>
      </footer>
    </div>;
}
