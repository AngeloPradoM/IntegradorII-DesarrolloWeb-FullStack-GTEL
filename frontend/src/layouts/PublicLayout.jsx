import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { Link, Outlet, useNavigate, useSearchParams } from "react-router-dom";
import { Briefcase, Menu, X } from "lucide-react";
import AuthModal from "../components/auth/AuthModal";
import ProfileMenu from "../components/auth/ProfileMenu";
import RegistrationModal from "../components/ui/RegistrationModal";
import { registerCandidate } from "../services/api";
import { getDefaultRouteForRole, getSafeAuthRedirect } from "../utils/auth";
export default function PublicLayout() {
  const {
    login,
    logout,
    isAuthenticated,
    user,
    isVerificationPending
  } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const modal = searchParams.get("auth");
  const setModal = (value, redirect) => {
    setSearchParams(previous => {
      const next = new URLSearchParams(previous);
      const resolved = typeof value === "function" ? value(previous.get("auth")) : value;
      if (resolved) next.set("auth", resolved);
      else { next.delete("auth"); next.delete("redirect"); }
      if (getSafeAuthRedirect(redirect)) next.set("redirect", redirect);
      return next;
    }, { replace: true });
  };
  const [registrationNotice, setRegistrationNotice] = useState("");
  const navigate = useNavigate();
  const openLogin = (redirect) => { setMenuOpen(false); setModal("login", redirect); };
  const handleApplicationsClick = event => {
    setMenuOpen(false);
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!isAuthenticated || !user?.token || isVerificationPending) {
      event.preventDefault();
      openLogin("/mis-postulaciones");
    }
  };
  const openRegister = () => { setMenuOpen(false); setRegistrationNotice(""); setModal("register"); };
  const handleAuthenticated = (result) => {
    login(result);
    const redirect = getSafeAuthRedirect(searchParams.get("redirect"));
    navigate(result.rol === "CANDIDATO" && redirect ? redirect : getDefaultRouteForRole(result.rol), { replace: true });
  };
  const handleRegister = async (payload) => {
    await registerCandidate(payload);
    setRegistrationNotice("Cuenta registrada correctamente en el servidor. Ya puedes iniciar sesión con tu correo y contraseña.");
    setModal("login");
  };
  return <div className="min-h-screen bg-[#F8FAFC] font-['Inter',sans-serif]">
      {/* Header */}
      <header className="bg-[#1E293B] text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-[1488px] mx-auto px-4 sm:px-6">
          <div className="flex min-h-18 flex-nowrap items-center justify-between gap-4">
            <Link to="/" className="flex shrink-0 items-center gap-3">
              <div className="w-9 h-9 bg-[#D32F2F] rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight">GTEL</span>
                <span className="text-base font-light ml-1 text-white/80">Talento</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden flex-1 items-center justify-center gap-4 whitespace-nowrap xl:flex">
              <Link to="/" className="text-sm text-white/70 hover:text-white transition-colors font-medium">Inicio</Link>
              <Link to="/#areas" className="text-sm text-white/70 hover:text-white transition-colors font-medium">Áreas de trabajo</Link>
              <Link to="/#como-postular" className="text-sm text-white/70 hover:text-white transition-colors font-medium">Cómo postular</Link>
              <Link to="/#preguntas" className="text-sm text-white/70 hover:text-white transition-colors font-medium">Preguntas frecuentes</Link>
              <Link to="/mis-postulaciones" onClick={handleApplicationsClick} className="text-sm text-white/70 hover:text-white transition-colors font-medium">Mis Postulaciones</Link>
            </nav>

            <div className="flex shrink-0 items-center gap-3 whitespace-nowrap">
              {isAuthenticated ? <ProfileMenu /> : <>
                <button type="button" onClick={openLogin} className="hidden xl:block text-sm font-medium text-white/80 hover:text-white transition-colors">
                  Iniciar Sesión
                </button>
                <button type="button" onClick={openRegister} className="hidden xl:block rounded-lg border border-white/30 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-white/60 hover:bg-white/10">
                  Registrarse
                </button>
              </>}
              <Link to="/ofertas" className="hidden xl:flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Ver Ofertas
              </Link>
              <button aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"} aria-controls="public-mobile-menu" aria-expanded={menuOpen} className="xl:hidden p-2 text-white/80" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && <div id="public-mobile-menu" className="xl:hidden bg-[#1E293B] border-t border-white/10 px-4 py-3 space-y-2">
            <Link to="/" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-white/80 hover:text-white">Inicio</Link>
            <Link to="/#areas" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-white/80 hover:text-white">Áreas de trabajo</Link>
            <Link to="/#como-postular" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-white/80 hover:text-white">Cómo postular</Link>
            <Link to="/#preguntas" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-white/80 hover:text-white">Preguntas frecuentes</Link>
            <Link to="/ofertas" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-white/80 hover:text-white">Ver Ofertas</Link>
            <Link to="/mis-postulaciones" onClick={handleApplicationsClick} className="block py-2 text-sm text-white/80 hover:text-white">Mis Postulaciones</Link>
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
      {modal === "login" && <AuthModal isOpen onClose={() => setModal(null)} onSubmit={handleAuthenticated} onRegisterClick={openRegister} notice={registrationNotice} />}
      <RegistrationModal isOpen={modal === "register"} onClose={() => setModal(null)} onSubmit={handleRegister} onLoginClick={openLogin} closeOnSubmit={false} />
    </div>;
}
