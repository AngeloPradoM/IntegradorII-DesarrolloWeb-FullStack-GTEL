import { Link } from "react-router-dom";
import { Phone, Shield } from "lucide-react";

const columns = [
  {
    title: "Candidatos",
    links: [
      { label: "Ver ofertas", to: "/ofertas" },
      { label: "Mis postulaciones", to: "/mis-postulaciones" },
      { label: "Iniciar sesión", to: "/login" },
      { label: "Registrarse", to: "/login?registro=1" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Inicio", to: "/" },
      { label: "Nuestra empresa", to: "/" },
      { label: "Blog laboral", to: "/ofertas" },
      { label: "Contacto", to: "/" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacidad", to: "/" },
      { label: "Términos de uso", to: "/" },
      { label: "Política de cookies", to: "/" },
      { label: "Soporte", to: "/" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-brand-navy bg-brand-navy text-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-red">
                <Phone className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-base font-bold tracking-tight">GTEL</div>
                <div className="text-xs uppercase tracking-wide text-slate-300">Talento</div>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-300">
              Plataforma oficial de reclutamiento de GTEL Telecomunicaciones S.A.C.
            </p>
          </div>

          {columns.map(({ title, links }) => (
            <div key={title}>
              <h4 className="mb-4 text-sm font-semibold text-white">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-xs text-slate-300 transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/15 pt-6 sm:flex-row">
          <p className="text-xs text-slate-300">© 2026 GTEL Telecomunicaciones. Todos los derechos reservados.</p>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Shield className="h-3 w-3" />
            <span>Datos protegidos bajo Ley 29733</span>
          </div>
        </div>
      </div>
    </footer>
  );
}