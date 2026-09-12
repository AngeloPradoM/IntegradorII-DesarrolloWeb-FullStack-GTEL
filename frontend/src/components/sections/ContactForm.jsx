import { Phone, Mail, MapPin, MessageSquare } from "lucide-react";

export default function ContactForm() {
  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-block bg-brand-red/10 text-brand-red px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide mb-3">
              Contáctanos
            </div>
            <h2 className="text-3xl font-bold text-brand-navy">¿Tienes alguna duda?</h2>
            <p className="text-brand-gray mt-2 text-sm">Escríbenos y un reclutador te responderá en menos de 24 horas.</p>
          </div>

          <form className="bg-brand-bg rounded-2xl p-8 border border-gray-200 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-brand-navy mb-1.5">Nombre completo</label>
                <input type="text" placeholder="Tu nombre" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-navy mb-1.5">Correo electrónico</label>
                <input type="email" placeholder="tu@correo.com" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-navy mb-1.5">Mensaje</label>
              <textarea rows={4} placeholder="¿En qué podemos ayudarte?" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red resize-none" />
            </div>
            <button type="submit" className="w-full bg-brand-red hover:bg-red-700 text-white py-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2">
              <MessageSquare className="w-4 h-4" /> Enviar Mensaje
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