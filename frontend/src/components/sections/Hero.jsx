import Button from "../common/Button";

export default function Hero() {
  return (
    <section
      className="bg-cover bg-center text-white"
      style={{ backgroundImage: "url('/assets/images/hero-callcenter.jpg')" }}
    >
      <div className="bg-brand-navy/70 py-24 px-6 text-center">
        <h1 className="text-3xl md:text-5xl font-bold mb-4">Únete a GTEL</h1>
        <p className="text-lg mb-8 max-w-xl mx-auto">
          Forma parte del equipo líder en telecomunicaciones.
        </p>
        <Button>Ver ofertas laborales</Button>
      </div>
    </section>
  );
}