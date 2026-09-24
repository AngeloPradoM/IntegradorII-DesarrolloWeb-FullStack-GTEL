import { Link } from "react-router-dom";
import { TrendingUp, Star, ChevronRight, CheckCircle } from "lucide-react";

export default function WorkWithUs() {
  return (
    <section id="nosotros" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1">
          <div className="inline-block bg-red-50 text-brand-red px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide mb-4 border border-red-100">
            Trabaja con nosotros
          </div>
          <h2 className="text-3xl font-bold text-brand-navy mb-5 leading-tight">
            Tu próximo paso, con un equipo que te acompaña
          </h2>
          <p className="text-brand-gray leading-relaxed mb-6">
            En GTEL Talento creemos que las personas son el corazón de la empresa. Ofrecemos un ambiente de trabajo dinámico, oportunidades reales de crecimiento y beneficios competitivos.
          </p>
          <ul className="space-y-3 mb-8">
            {[
              "Crecimiento profesional acelerado",
              "Capacitación continua y certificaciones",
              "Beneficios de salud para ti y tu familia",
              "Trabajo híbrido y horarios flexibles",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-brand-gray">
                <CheckCircle className="w-4 h-4 text-brand-red flex-shrink-0" /> {item}
              </li>
            ))}
          </ul>
          <Link to="/ofertas" className="inline-flex items-center gap-2 bg-brand-red hover:bg-brand-red-hover text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-md ">
            Explorar oportunidades <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex-1 flex justify-center">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1766066014237-00645c74e9c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500"
              alt="Equipo GTEL"
              className="w-full max-w-sm rounded-2xl object-cover shadow-md ring-1 ring-slate-200"
              style={{ aspectRatio: "4/5" }}
            />
            <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-md p-4 flex items-center gap-3 border border-gray-100">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-brand-red" />
              </div>
              <div>
                <div className="text-xs text-brand-gray">Vacantes este mes</div>
                <div className="text-base font-bold text-brand-navy">+24 posiciones</div>
              </div>
            </div>
            <div className="absolute top-4 right-4 bg-brand-red text-white rounded-xl px-4 py-2 shadow-lg">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-white" />
                <span className="text-sm font-bold">4.8</span>
              </div>
              <div className="text-xs text-white/80">Empleados satisfechos</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}