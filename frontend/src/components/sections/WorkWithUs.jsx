export default function WorkWithUs() {
  return (
    <section id="nosotros" className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 items-center px-6 py-20">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-brand-navy mb-4">
          Construye el futuro de las telecomunicaciones
        </h2>
        <p className="text-brand-gray text-base leading-relaxed">
          En GTEL creemos que las personas son el corazón de la empresa.
          Ofrecemos un ambiente dinámico, crecimiento real y beneficios
          competitivos que marcan la diferencia.
        </p>
      </div>
      <img
        src="/assets/images/work-with-us.jpg"
        alt="Equipo GTEL trabajando"
        className="rounded-2xl shadow-md w-full h-80 object-cover"
      />
    </section>
  );
}