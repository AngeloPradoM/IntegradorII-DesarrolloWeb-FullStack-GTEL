import Button from "../common/Button";

export default function ContactForm() {
  return (
    <section id="contacto" className="max-w-2xl mx-auto px-6 py-16">
      <div className="bg-white rounded-xl shadow-sm p-8">
        <h3 className="text-xl font-bold text-brand-navy mb-1">¿Tienes alguna duda?</h3>
        <p className="text-brand-gray text-sm mb-4">
          Escríbenos y un reclutador te responderá en menos de 24 horas.
        </p>
        <form className="space-y-4">
          <input className="w-full border rounded-lg px-4 py-2" placeholder="Nombre completo" />
          <input className="w-full border rounded-lg px-4 py-2" placeholder="Correo electrónico" />
          <textarea className="w-full border rounded-lg px-4 py-2" placeholder="¿En qué podemos ayudarte?" rows={3} />
          <Button>Enviar Mensaje</Button>
        </form>
      </div>
    </section>
  );
}