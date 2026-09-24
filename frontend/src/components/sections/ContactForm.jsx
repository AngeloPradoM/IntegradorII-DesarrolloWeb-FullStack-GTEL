import { Phone, Mail, MapPin, MessageSquare } from "lucide-react";

export default function ContactForm() {
  return (
    <section id="contacto" className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-block bg-brand-red/10 text-brand-red px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide mb-3">
              Contáctanos
            </div>
            <h2 className="text-3xl font-bold text-brand-navy">¿Tienes alguna duda?</h2>
            <p className="text-brand-gray mt-2 text-sm">Cuéntanos qué necesitas. Estamos aquí para orientarte en tu postulación.</p>
          </div>

          <form className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-8 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-brand-navy">Nombre completo</label>
                <input type="text" placeholder="Tu nombre" className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-brand-navy">Correo electrónico</label>
                <input type="email" placeholder="tu@correo.com" className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-brand-navy">Mensaje</label>
              <textarea rows={4} placeholder="¿En qué podemos ayudarte?" className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20" />
            </div>
            <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-red py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-red-hover shadow-md ">
              <MessageSquare className="w-4 h-4" /> Enviar mensaje
            </button>
          </form>

          <div className="flex flex-wrap justify-center gap-6 mt-8">
            {[{ icon: Phone, text: "(01) 800-4835" }, { icon: Mail, text: "talento@gtel.com.pe" }, { icon: MapPin, text: "Av. Javier Prado 1500, Lima" }].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-sm text-brand-gray">
                <Icon className="w-4 h-4 text-brand-red" /> {text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}