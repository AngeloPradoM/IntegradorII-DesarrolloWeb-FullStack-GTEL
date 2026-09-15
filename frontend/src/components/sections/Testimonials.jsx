import { Star } from "lucide-react";

const testimonials = [
  { name: "Carlos Mendoza", role: "Agente Senior, Lima", text: "Entré como agente hace 3 años y hoy lidero un equipo de 15 personas. GTEL cumple sus promesas.", stars: 5 },
  { name: "María Torres", role: "Supervisora de Ventas", text: "El ambiente de trabajo es increíble. Siempre hay apoyo de los compañeros y los jefes son accesibles.", stars: 5 },
  { name: "Luis Flores", role: "Especialista Técnico", text: "Las capacitaciones son de primera calidad y los beneficios de salud cubrieron a toda mi familia.", stars: 4 },
];

export default function Testimonials() {
  return (
    <section className="bg-brand-navy py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-white text-center mb-10">Lo que dicen nuestros colaboradores</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(({ name, role, text, stars }) => (
            <div key={name} className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex mb-3">
                {Array.from({ length: stars }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-white/80 text-sm leading-relaxed mb-4">"{text}"</p>
              <div className="text-white font-semibold text-sm">{name}</div>
              <div className="text-white/50 text-xs">{role}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}