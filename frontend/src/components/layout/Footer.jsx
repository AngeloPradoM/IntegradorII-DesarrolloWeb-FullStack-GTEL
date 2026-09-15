import { Phone, Shield } from "lucide-react";

const columns = [
  { title: "Candidatos", links: ["Ver Ofertas", "Mis Postulaciones", "Crear Perfil", "Consejos CV"] },
  { title: "Empresa", links: ["Acerca de GTEL", "Noticias", "Blog Laboral", "RSE"] },
  { title: "Legal", links: ["Privacidad", "Términos de Uso", "Política de Cookies", "Contacto"] },
];

export default function Footer() {
  return (
    <footer className="bg-brand-navy text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-brand-red rounded-lg flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </div>
              <span className="font-bold">GTEL Talento</span>
            </div>
            <p className="text-xs text-white/50 leading-relaxed">
              Plataforma oficial de reclutamiento de GTEL Telecomunicaciones S.A.C.
            </p>
          </div>
          {columns.map(({ title, links }) => (
            <div key={title}>
              <h4 className="text-sm font-semibold mb-4">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-xs text-white/50 hover:text-white transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/40">© 2026 GTEL Telecomunicaciones. Todos los derechos reservados.</p>
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Shield className="w-3 h-3" /> Datos protegidos bajo Ley 29733
          </div>
        </div>
      </div>
    </footer>
  );
}