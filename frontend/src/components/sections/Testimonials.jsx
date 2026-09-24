import { Star } from "lucide-react";

const testimonials = [
  { name: "Carlos Mendoza", role: "Agente Senior, Lima", text: "Entré como agente hace 3 años y hoy lidero un equipo de 15 personas. GTEL cumple sus promesas.", stars: 5 },
  { name: "María Torres", role: "Supervisora de Ventas", text: "El ambiente de trabajo es increíble. Siempre hay apoyo de los compañeros y los jefes son accesibles.", stars: 5 },
  { name: "Luis Flores", role: "Especialista Técnico", text: "Las capacitaciones son de primera calidad y los beneficios de salud cubrieron a toda mi familia.", stars: 4 },
];

export default function Testimonials() {
  return (
    <section className="bg-slate-50 py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-block bg-white text-brand-gray px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide mb-3 border border-slate-200">
            Testimonios
          </div>
          <h2 className="text-2xl font-bold text-brand-navy">Lo que dicen nuestros colaboradores</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(({ name, role, text, stars }) => (
            <div key={name} className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg  backdrop-blur-sm">
              <div className="mb-3 flex">
                {Array.from({ length: stars }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-[#B89763] text-[#B89763]" />
                ))}
              </div>
              <p className="mb-4 text-sm leading-relaxed text-brand-gray">"{text}"</p>
              <div className="text-sm font-semibold text-brand-navy">{name}</div>
              <div className="text-xs text-brand-gray">{role}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}