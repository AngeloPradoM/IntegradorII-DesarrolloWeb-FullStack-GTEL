import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { Briefcase, Menu, X } from "lucide-react";
import Footer from "../components/layout/Footer";


export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-brand-bg font-sans">
      <header className="bg-brand-navy text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 bg-brand-red rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight">GTEL</span>
                <span className="text-base font-light ml-1 text-white/80">Talento</span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-sm text-white/70 hover:text-white transition-colors font-medium">Inicio</Link>
              <Link to="/ofertas" className="text-sm text-white/70 hover:text-white transition-colors font-medium">Ofertas</Link>
              <Link to="/mis-postulaciones" className="text-sm text-white/70 hover:text-white transition-colors font-medium">Mis Postulaciones</Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link to="/login" className="hidden md:block text-sm font-medium text-white/80 hover:text-white transition-colors">
                Iniciar Sesión
              </Link>
              <Link to="/ofertas" className="hidden md:flex items-center gap-2 bg-brand-red hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Ver Ofertas
              </Link>
              <button className="md:hidden p-2 text-white/80" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-brand-navy border-t border-white/10 px-4 py-3 space-y-2">
            <Link to="/" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-white/80 hover:text-white">Inicio</Link>
            <Link to="/ofertas" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-white/80 hover:text-white">Ofertas</Link>
            <Link to="/mis-postulaciones" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-white/80 hover:text-white">Mis Postulaciones</Link>
            <Link to="/login" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-white/80 hover:text-white">Iniciar Sesión</Link>
          </div>
        )}
      </header>

      <Outlet />

      <Footer />
    </div>
  );
}