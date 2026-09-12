import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative bg-brand-navy text-white overflow-hidden min-h-[560px] flex items-center">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(https://images.unsplash.com/photo-1712159018726-4564d92f3ec2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1400)` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-navy/95 via-brand-navy/80 to-transparent" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 bg-brand-red/20 border border-brand-red/40 text-red-400 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-5">
            <span className="w-2 h-2 bg-brand-red rounded-full animate-pulse" />
            Oportunidades abiertas ahora
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-5">
            Únete a <span className="text-brand-red">GTEL</span> y<br />transforma tu carrera
          </h1>
          <p className="text-white/70 text-base leading-relaxed mb-8 max-w-md">
            Somos el call center líder en telecomunicaciones del país. Buscamos personas apasionadas que quieran crecer con nosotros.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/ofertas" className="inline-flex items-center gap-2 bg-brand-red hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold text-sm transition-all hover:shadow-lg hover:shadow-brand-red/30">
              Ver Empleos Disponibles <ChevronRight className="w-4 h-4" />
            </Link>
            <Link to="/mis-postulaciones" className="inline-flex items-center gap-2 border border-white/30 hover:border-white/60 text-white/80 hover:text-white px-6 py-3 rounded-lg font-medium text-sm transition-all">
              Mis Postulaciones
            </Link>
          </div>
          <div className="flex items-center gap-6 mt-8 pt-6 border-t border-white/10">
            {[["500+", "Empleados"], ["98%", "Satisfacción"], ["12", "Años de experiencia"]].map(([val, lbl]) => (
              <div key={lbl}>
                <div className="text-xl font-bold text-brand-red">{val}</div>
                <div className="text-xs text-white/50">{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}