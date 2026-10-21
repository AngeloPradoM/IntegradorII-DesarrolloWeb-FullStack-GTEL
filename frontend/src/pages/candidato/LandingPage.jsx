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
  return <div className="font-['Inter',sans-serif]">
      {/* HERO SECTION */}
      <section className="relative bg-[#1E293B] text-white overflow-hidden min-h-[560px] flex items-center">
        <div className="absolute inset-0 bg-cover bg-center" style={{
        backgroundImage: `url(https://images.unsplash.com/photo-1712159018726-4564d92f3ec2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1400)`
      }} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1E293B]/95 via-[#1E293B]/80 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-[#D32F2F]/20 border border-[#D32F2F]/40 text-[#FF5252] px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-5">
              <span className="w-2 h-2 bg-[#D32F2F] rounded-full animate-pulse" />
              Oportunidades abiertas ahora
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-5">
              Únete a <span className="text-[#D32F2F]">GTEL</span> y<br />
              transforma tu carrera
            </h1>
            <p className="text-white/70 text-base leading-relaxed mb-8 max-w-md">
              Somos el call center líder en telecomunicaciones del país. Buscamos personas apasionadas que quieran crecer con nosotros.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/ofertas" className="inline-flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white px-6 py-3 rounded-lg font-semibold text-sm transition-all hover:shadow-lg hover:shadow-[#D32F2F]/30">
                Ver Empleos Disponibles
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex items-center gap-6 mt-8 pt-6 border-t border-white/10">
              {[["500+", "Empleados"], ["98%", "Satisfacción"], ["12", "Años de experiencia"]].map(([val, lbl]) => <div key={lbl}>
                  <div className="text-xl font-bold text-[#D32F2F]">{val}</div>
                  <div className="text-xs text-white/50">{lbl}</div>
                </div>)}
            </div>
          </div>
        </div>
      </section>

      {/* TRABAJA CON NOSOTROS - 50/50 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1">
            <div className="inline-block bg-[#D32F2F]/10 text-[#D32F2F] px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide mb-4">
              Trabaja con nosotros
            </div>
            <h2 className="text-3xl font-bold text-[#1E293B] mb-5 leading-tight">
              Construye el futuro de las<br />telecomunicaciones
            </h2>
            <p className="text-[#475569] leading-relaxed mb-6">
              En GTEL Talento creemos que las personas son el corazón de la empresa. Ofrecemos un ambiente de trabajo dinámico, oportunidades reales de crecimiento y beneficios competitivos que marcan la diferencia.
            </p>
            <ul className="space-y-3 mb-8">
              {["Crecimiento profesional acelerado", "Capacitación continua y certificaciones", "Beneficios de salud para ti y tu familia", "Trabajo híbrido y horarios flexibles"].map(item => <li key={item} className="flex items-center gap-3 text-sm text-[#475569]">
                  <CheckCircle className="w-4 h-4 text-[#D32F2F] flex-shrink-0" />
                  {item}
                </li>)}
            </ul>
            <Link to="/ofertas" className="inline-flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors">
              Explorar Oportunidades
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex-1 flex justify-center">
            <div className="relative">
              <img src="https://images.unsplash.com/photo-1766066014237-00645c74e9c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500" alt="GTEL team member" className="w-full max-w-sm rounded-2xl object-cover shadow-2xl" style={{
              aspectRatio: "4/5"
            }} />
              <div className="absolute -bottom-5 -left-5 bg-white rounded-xl shadow-xl p-4 flex items-center gap-3 border border-gray-100">
                <div className="w-10 h-10 bg-[#D32F2F]/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[#D32F2F]" />
                </div>
                <div>
                  <div className="text-xs text-[#475569]">Vacantes este mes</div>
                  <div className="text-base font-bold text-[#1E293B]">+24 posiciones</div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-[#D32F2F] text-white rounded-xl px-4 py-2 shadow-lg">
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
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block bg-[#D32F2F]/10 text-[#D32F2F] px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide mb-3">
              ¿Por qué elegirnos?
            </div>
            <h2 className="text-3xl font-bold text-[#1E293B]">Información Clave</h2>
            <p className="text-[#475569] mt-3 max-w-xl mx-auto text-sm">
              Todo lo que necesitas saber para dar el siguiente paso en tu carrera profesional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[{
            icon: Clock,
            title: "Horarios Flexibles",
            desc: "Turnos de mañana, tarde y noche. Modalidad híbrida disponible para muchos roles. Adaptamos tu jornada a tu vida.",
            color: "bg-blue-50",
            iconColor: "text-blue-600"
          }, {
            icon: Award,
            title: "Salarios Competitivos",
            desc: "Remuneración acorde al mercado, bonificaciones por desempeño y comisiones. Tu esfuerzo tiene recompensa real.",
            color: "bg-red-50",
            iconColor: "text-[#D32F2F]"
          }, {
            icon: Users,
            title: "Cultura Inclusiva",
            desc: "Somos una empresa diversa e incluyente. Más de 40 nacionalidades trabajan con nosotros en un ambiente de respeto.",
            color: "bg-green-50",
            iconColor: "text-green-600"
          }, {
            icon: TrendingUp,
            title: "Plan de Carrera",
            desc: "El 80% de nuestros líderes comenzaron en posiciones de entrada. Creemos en el talento interno.",
            color: "bg-purple-50",
            iconColor: "text-purple-600"
          }, {
            icon: Wifi,
            title: "Tecnología de Punta",
            desc: "Trabajamos con las mejores herramientas y plataformas tecnológicas del sector telecomunicaciones.",
            color: "bg-orange-50",
            iconColor: "text-orange-600"
          }, {
            icon: MapPin,
            title: "Múltiples Ubicaciones",
            desc: "Sedes en Lima, Arequipa y Trujillo. Encuentra la posición más cercana a donde vives.",
            color: "bg-teal-50",
            iconColor: "text-teal-600"
          }].map(({
            icon: Icon,
            title,
            desc,
            color,
            iconColor
          }) => <div key={title} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-6 h-6 ${iconColor}`} />
                </div>
                <h3 className="font-bold text-[#1E293B] mb-2">{title}</h3>
                <p className="text-sm text-[#475569] leading-relaxed">{desc}</p>
              </div>)}
          </div>
        </div>
      </section>

      <CandidateGuide />

      {/* TESTIMONIOS */}
      <section className="bg-[#1E293B] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white">Lo que dicen nuestros colaboradores</h2>
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
          }) => <div key={name} className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex mb-3">
                  {Array.from({
                length: stars
              }).map((_, i) => <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-white/80 text-sm leading-relaxed mb-4">"{text}"</p>
                <div>
                  <div className="text-white font-semibold text-sm">{name}</div>
                  <div className="text-white/50 text-xs">{role}</div>
                </div>
              </div>)}
          </div>
        </div>
      </section>

      {/* CONTACT FORM */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-block bg-[#D32F2F]/10 text-[#D32F2F] px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide mb-3">
                Contáctanos
              </div>
              <h2 className="text-3xl font-bold text-[#1E293B]">¿Tienes alguna duda?</h2>
              <p className="text-[#475569] mt-2 text-sm">Escríbenos y un reclutador te responderá en menos de 24 horas.</p>
            </div>

            <form className="bg-[#F8FAFC] rounded-2xl p-8 border border-gray-200 shadow-sm space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Nombre completo</label>
                  <input type="text" placeholder="Tu nombre" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Correo electrónico</label>
                  <input type="email" placeholder="tu@correo.com" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Mensaje</label>
                <textarea rows={4} placeholder="¿En qué podemos ayudarte?" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] resize-none" />
              </div>
              <button type="submit" className="w-full bg-[#D32F2F] hover:bg-[#B71C1C] text-white py-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2">
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
            }) => <div key={text} className="flex items-center gap-2 text-sm text-[#475569]">
                  <Icon className="w-4 h-4 text-[#D32F2F]" />
                  {text}
                </div>)}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#1E293B] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#D32F2F] rounded-lg flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <span className="font-bold">GTEL Talento</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">
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
                      <Link to={({"Ver Ofertas":"/ofertas","Mis Postulaciones":"/mis-postulaciones","Crear Perfil":"/login?registro=1"})[link] || "/"} className="text-xs text-white/50 hover:text-white transition-colors">{link}</Link>
                    </li>)}
                </ul>
              </div>)}
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-white/40">© 2026 GTEL Telecomunicaciones. Todos los derechos reservados.</p>
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Shield className="w-3 h-3" />
              Datos protegidos bajo Ley 29733
            </div>
          </div>
        </div>
      </footer>
    </div>;
}
