import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Briefcase, Menu, X } from "lucide-react";
import AuthModal from "../components/auth/AuthModal";
import RegistrationModal from "../components/ui/RegistrationModal";
import { registerCandidate } from "../services/api";
import { getDefaultRouteForRole } from "../utils/auth";
export default function PublicLayout() {
  const {
    login,
    logout,
    isAuthenticated
  } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [registrationNotice, setRegistrationNotice] = useState("");
  const navigate = useNavigate();
  const openLogin = () => { setMenuOpen(false); setModal("login"); };
  const openRegister = () => { setMenuOpen(false); setRegistrationNotice(""); setModal("register"); };
  const handleAuthenticated = (result) => {
    login(result);
    setModal(null);
    navigate(getDefaultRouteForRole(result.rol));
  };
  const handleRegister = async (payload) => {
    await registerCandidate(payload);
    setRegistrationNotice("Cuenta creada. Inicia sesión para verificar tu WhatsApp.");
    setModal("login");
  };
  return <div className="min-h-screen bg-[#F8FAFC] font-['Inter',sans-serif]">
      {/* Header */}
      <header className="bg-[#1E293B] text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#D32F2F] rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight">GTEL</span>
                <span className="text-base font-light ml-1 text-white/80">Talento</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-sm text-white/70 hover:text-white transition-colors font-medium">Inicio</Link>
              <Link to="/ofertas" className="text-sm text-white/70 hover:text-white transition-colors font-medium">Ofertas</Link>
              <Link to="/mis-postulaciones" className="text-sm text-white/70 hover:text-white transition-colors font-medium">Mis Postulaciones</Link>
            </nav>

            <div className="flex items-center gap-3">
              {isAuthenticated ? <button onClick={logout} className="hidden md:block text-sm text-white/80 hover:text-white">Cerrar sesión</button> : <>
                <button type="button" onClick={openLogin} className="hidden md:block text-sm font-medium text-white/80 hover:text-white transition-colors">
                  Iniciar Sesión
                </button>
                <button type="button" onClick={openRegister} className="hidden md:block rounded-lg border border-white/30 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-white/60 hover:bg-white/10">
                  Registrarse
                </button>
              </>}
              <Link to="/ofertas" className="hidden md:flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Ver Ofertas
              </Link>
              <button aria-label="Abrir menú" aria-expanded={menuOpen} className="md:hidden p-2 text-white/80" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && <div className="md:hidden bg-[#1E293B] border-t border-white/10 px-4 py-3 space-y-2">
            <Link to="/" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-white/80 hover:text-white">Inicio</Link>
            <Link to="/ofertas" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-white/80 hover:text-white">Ofertas</Link>
            <Link to="/mis-postulaciones" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-white/80 hover:text-white">Mis Postulaciones</Link>
            {isAuthenticated ? <button onClick={() => {
          logout();
          setMenuOpen(false);
        }} className="block py-2 text-sm text-white/80">Cerrar sesión</button> : <>
              <button type="button" onClick={openLogin} className="block w-full py-2 text-left text-sm text-white/80 hover:text-white">Iniciar Sesión</button>
              <button type="button" onClick={openRegister} className="block w-full py-2 text-left text-sm font-semibold text-white hover:text-red-300">Registrarse</button>
            </>}
          </div>}
      </header>

      <main id="contenido"><Outlet context={{ openLogin, openRegister }} /></main>
      <AuthModal isOpen={modal === "login"} onClose={() => setModal(null)} onSubmit={handleAuthenticated} onRegisterClick={openRegister} notice={registrationNotice} />
      <RegistrationModal isOpen={modal === "register"} onClose={() => setModal(current => current === "register" ? null : current)} onSubmit={handleRegister} />
    </div>;
}
