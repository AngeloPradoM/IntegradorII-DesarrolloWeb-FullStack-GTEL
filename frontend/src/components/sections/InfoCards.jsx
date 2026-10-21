import { Clock, Award, Users, TrendingUp, Wifi, MapPin } from "lucide-react";

const items = [
  { icon: Clock, title: "Horarios Flexibles", desc: "Turnos de mañana, tarde y noche. Modalidad híbrida disponible.", color: "bg-sky-50", iconColor: "text-sky-700" },
  { icon: Award, title: "Salarios Competitivos", desc: "Remuneración acorde al mercado, bonificaciones y comisiones.", color: "bg-red-50", iconColor: "text-brand-red" },
  { icon: Users, title: "Cultura Inclusiva", desc: "Empresa diversa e incluyente, +40 nacionalidades trabajando juntas.", color: "bg-emerald-50", iconColor: "text-emerald-700" },
  { icon: TrendingUp, title: "Plan de Carrera", desc: "El 80% de nuestros líderes empezaron en posiciones de entrada.", color: "bg-slate-50", iconColor: "text-slate-600" },
  { icon: Wifi, title: "Tecnología de Punta", desc: "Trabajamos con las mejores herramientas del sector telecom.", color: "bg-slate-50", iconColor: "text-slate-600" },
  { icon: MapPin, title: "Múltiples Ubicaciones", desc: "Sedes en Lima, Arequipa y Trujillo.", color: "bg-cyan-50", iconColor: "text-cyan-700" },
];

export default function InfoCards() {
  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-block bg-brand-red/10 text-brand-red px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide mb-3">
            ¿Por qué elegirnos?
          </div>
          <h2 className="text-3xl font-bold text-brand-navy">Un lugar para seguir creciendo</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map(({ icon: Icon, title, desc, color, iconColor }) => (
            <div key={title} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
              <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4  transition-transform`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
              </div>
              <h3 className="font-bold text-brand-navy mb-2">{title}</h3>
              <p className="text-sm text-brand-gray leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}