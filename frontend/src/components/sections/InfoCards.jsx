const items = [
  { icon: "🕐", title: "Horarios Flexibles", text: "Turnos de mañana, tarde y noche." },
  { icon: "💰", title: "Salarios Competitivos", text: "Remuneración acorde al mercado más comisiones." },
  { icon: "🤝", title: "Cultura Inclusiva", text: "Diversidad de +40 nacionalidades trabajando juntas." },
  { icon: "📈", title: "Plan de Carrera", text: "El 80% de nuestros líderes empezaron en posiciones de entrada." },
  { icon: "💻", title: "Tecnología de Punta", text: "Trabaja con las mejores plataformas del sector." },
  { icon: "📍", title: "Múltiples Ubicaciones", text: "Sedes en Lima, Arequipa y Trujillo." },
];

export default function InfoCards() {
  return (
    <section className="bg-brand-bg py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-brand-navy text-center mb-10">
          Información Clave
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-3xl mb-4">{item.icon}</div>
              <h3 className="font-bold text-brand-navy text-lg mb-2">{item.title}</h3>
              <p className="text-brand-gray text-sm">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}