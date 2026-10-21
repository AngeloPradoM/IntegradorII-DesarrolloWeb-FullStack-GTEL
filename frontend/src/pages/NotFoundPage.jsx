import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return <section className="mx-auto max-w-xl px-6 py-20 text-center">
    <p className="text-5xl font-bold text-brand-red">404</p>
    <h1 className="mt-5 text-2xl font-bold text-brand-navy">Esta página no existe</h1>
    <p className="my-5 text-brand-gray">Revisa la dirección o continúa explorando las oportunidades de GTEL.</p>
    <div className="flex justify-center gap-4"><Link to="/" className="rounded-lg border border-slate-200 bg-white px-4 py-3">Volver al inicio</Link><Link to="/ofertas" className="rounded-lg bg-brand-red px-4 py-3 text-white">Ver ofertas</Link></div>
  </section>;
}
