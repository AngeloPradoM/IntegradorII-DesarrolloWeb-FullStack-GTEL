import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Briefcase,
  ChevronDown,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  UserCircle2,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "../ui/ThemeToggle";
import NotificationBell from "./NotificationBell";

const publicNavItems = [
  { label: "Inicio", href: "/" },
  { label: "Ofertas", href: "/ofertas" },
  { label: "Candidatos", href: "/candidato" },
];

const candidateNavItems = [
  { label: "Mis postulaciones", href: "/mis-postulaciones" },
  { label: "Ofertas", href: "/ofertas" },
];

function getNavItemsForUser(role, isAuthenticated) {
  if (!isAuthenticated) {
    return publicNavItems;
  }

  if (role === "RECLUTADOR") {
    return [];
  }

  return candidateNavItems;
}

export default function Header({
  user,
  onOpenAuth,
  onRegisterClick,
  onLogout,
  variant = "public",
  isMobileOpen = false,
  onToggleSidebar,
}) {
  const { user: authUser, logout } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const [searchValue, setSearchValue] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return sessionStorage.getItem("gtel-recruiter-search") || "";
  });

  const navigate = useNavigate();
  const location = useLocation();

  const currentUser = user || authUser;

  // El usuario se considera autenticado cuando existe un token.
  const isAuthenticated = Boolean(currentUser?.token);

  const isRecruiter =
    variant === "recruiter" || currentUser?.rol === "RECLUTADOR";

  const displayName =
    currentUser?.nombres || currentUser?.email || "Usuario";

  const navItems = getNavItemsForUser(
    currentUser?.rol,
    isAuthenticated
  );

  const brandLink = isRecruiter
    ? "/reclutador/dashboard"
    : isAuthenticated
      ? "/mis-postulaciones"
      : "/";

  const isMisPostulacionesPage =
    location.pathname === "/mis-postulaciones" &&
    isAuthenticated &&
    !isRecruiter;

  const closeMenus = () => {
    setMenuOpen(false);
    setProfileMenuOpen(false);
  };

  const handleRegister = () => {
    closeMenus();

    if (onRegisterClick) {
      onRegisterClick();
      return;
    }

    navigate("/login?registro=1");
  };

  const handleProfileEdit = () => {
    closeMenus();
    navigate("/perfil");
  };

  const handleLogout = () => {
    closeMenus();

    if (onLogout) {
      onLogout();
      return;
    }

    logout();
    navigate("/");
  };

  const handleSearchChange = (event) => {
    const value = event.target.value;

    setSearchValue(value);

    if (typeof window !== "undefined") {
      sessionStorage.setItem("gtel-recruiter-search", value);
    }
  };

  /*
   * Header especial para reclutadores
   */
  if (isRecruiter) {
    return (
      <header className="bg-white border-b border-gray-100 px-4 lg:px-6 py-3 flex items-center gap-4 flex-shrink-0 dark:bg-slate-900 dark:border-slate-800">
        <button
          type="button"
          aria-label="Abrir menú lateral"
          className="rounded-md p-2 text-brand-navy transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 lg:hidden"
          onClick={onToggleSidebar}
        >
          {isMobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>

        <form className="max-w-md flex-1" onSubmit={event=>{event.preventDefault();navigate(`/reclutador/postulantes?q=${encodeURIComponent(searchValue.trim())}`);}}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-slate-500" />

            <input
              type="text"
              value={searchValue}
              onChange={handleSearchChange}
              placeholder="Buscar candidatos (Enter)..."
              className="w-full rounded-lg border border-gray-200 bg-brand-bg py-2.5 pl-9 pr-4 text-sm text-brand-navy placeholder:text-gray-400 focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle />
          <NotificationBell />

          <button type="button" onClick={handleProfileEdit} aria-label="Editar perfil" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-brand-red/20 bg-red-50 text-xs font-bold text-brand-red">
              {currentUser?.foto ? <img src={currentUser.foto} alt="" className="h-full w-full rounded-full object-cover" /> : (displayName || "U").slice(0, 2).toUpperCase()}
            </div>

            <span className="hidden text-sm font-medium text-brand-navy md:block">
              {displayName}
            </span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="hidden rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-brand-gray transition-colors hover:border-brand-red hover:text-brand-red lg:inline-flex"
          >
            Cerrar sesión
          </button>
        </div>
      </header>
    );
  }

  /*
   * Header público y header de candidato
   */
  return (
  <>
    <header
      className="sticky top-0 z-50 border-b border-slate-200 bg-white text-brand-navy dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 transition-colors"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* LOGO */}
          <Link
            to={brandLink}
            onClick={closeMenus}
            className="flex items-center gap-3 rounded-full px-2 py-1 transition hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-red shadow-md ">
              <Briefcase className="h-5 w-5 text-white" />
            </div>

            <div>
              <span className="text-base font-bold tracking-tight text-brand-navy dark:text-white">
                GTEL
              </span>

              <span className="ml-1 text-base font-light text-brand-gray dark:text-slate-400">
                Talento
              </span>
            </div>
          </Link>

          {/* NAVEGACIÓN PÚBLICA */}
          {!isAuthenticated && (
            <nav className="hidden items-center gap-8 lg:flex">
              {navItems.map(({ label, href }) => (
                <Link
                  key={href}
                  aria-current={location.pathname === href ? "page" : undefined}
                  to={href}
                  className="text-sm font-medium text-brand-gray transition-colors hover:text-brand-red"
                >
                  {label}
                </Link>
              ))}
            </nav>
          )}

          {/* USUARIO AUTENTICADO */}
          {isAuthenticated ? (
            <div className="hidden items-center gap-4 md:flex">

              {/* NAVEGACIÓN */}
              {navItems.map(({ label, href }) => (
                <Link
                  key={href}
                  aria-current={location.pathname === href ? "page" : undefined}
                  to={href}
                  className="text-sm font-medium text-brand-gray transition-colors hover:text-brand-red"
                >
                  {label}
                </Link>
              ))}

              {/* NUEVA POSTULACIÓN */}
              {isMisPostulacionesPage && (
                <Link
                  to="/ofertas"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-red px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-brand-red-hover"
                >
                  <Plus className="h-4 w-4" />
                  Nueva postulación
                </Link>
              )}

              {/* THEME TOGGLE */}
              <ThemeToggle />

              {/* NOTIFICACIONES */}
              <NotificationBell />

              {/* PERFIL */}
              <div className="relative">
                <button
                  type="button"
                  aria-label="Abrir menú de perfil"
                  aria-expanded={profileMenuOpen}
                  onClick={() =>
                    setProfileMenuOpen((value) => !value)
                  }
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-2 text-brand-navy shadow-sm transition hover:border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <UserCircle2 className="h-5 w-5 text-brand-gray dark:text-slate-400" />

                  <span className="text-sm font-medium text-brand-navy dark:text-slate-200">
                    {displayName}
                  </span>

                  <ChevronDown className="h-4 w-4 text-brand-gray dark:text-slate-400" />
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md dark:border-slate-800 dark:bg-slate-900">
                    <button
                      type="button"
                      onClick={handleProfileEdit}
                      className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <Settings className="h-4 w-4 text-brand-navy dark:text-slate-200" />
                      Editar perfil
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <LogOut className="h-4 w-4" />
                      Salir de la cuenta
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* USUARIO NO AUTENTICADO */
            <div className="hidden items-center gap-3 lg:flex">
              <ThemeToggle />

              <button
                type="button"
                onClick={onOpenAuth}
                className="text-sm font-medium text-brand-gray transition-colors hover:text-brand-red dark:text-slate-300 dark:hover:text-brand-red"
              >
                Iniciar sesión
              </button>

              <button
                type="button"
                onClick={handleRegister}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-brand-navy transition-colors hover:border-slate-300 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Registrarse
              </button>

              <Link
                to="/ofertas"
                className="rounded-lg bg-brand-red px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-red-hover"
              >
                Ver ofertas
              </Link>
            </div>
          )}

          {/* MENÚ MOBILE */}
          <button
            type="button"
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
            className={`rounded-md p-2 transition-colors ${
              isAuthenticated
                ? "text-brand-navy hover:text-sky-200 md:hidden"
                : "text-brand-gray hover:text-brand-red lg:hidden"
            }`}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </header>

    {/* MENÚ MOBILE */}
    {menuOpen && !isRecruiter && (
      <div
        className={
          isAuthenticated
            ? "border-b border-slate-200 bg-white px-4 py-3 md:hidden dark:border-slate-800 dark:bg-slate-900"
            : "border-b border-slate-200 bg-white px-4 py-3 lg:hidden dark:border-slate-800 dark:bg-slate-900"
        }
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tema</span>
            <ThemeToggle />
          </div>

          {navItems.map(({ label, href }) => (
            <Link
              key={href}
              aria-current={location.pathname === href ? "page" : undefined}
              to={href}
              onClick={closeMenus}
              className="block py-2 text-sm text-brand-gray transition-colors hover:text-brand-red dark:text-slate-300 dark:hover:text-brand-red"
            >
              {label}
            </Link>
          ))}

          {isAuthenticated ? (
            <>
              {/* NUEVA POSTULACIÓN MOBILE */}
              {isMisPostulacionesPage && (
                <Link
                  to="/ofertas"
                  onClick={closeMenus}
                  className="flex items-center gap-2 py-2 text-sm font-semibold text-brand-red"
                >
                  <Plus className="h-4 w-4" />
                  Nueva postulación
                </Link>
              )}

              <button
                type="button"
                onClick={handleProfileEdit}
                className="block w-full py-2 text-left text-sm text-brand-gray transition-colors hover:text-brand-red dark:text-slate-300 dark:hover:text-brand-red"
              >
                Editar perfil
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="block w-full py-2 text-left text-sm text-brand-red transition-colors hover:text-brand-red"
              >
                Salir de la cuenta
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  closeMenus();
                  onOpenAuth?.();
                }}
                className="block w-full py-2 text-left text-sm text-brand-gray transition-colors hover:text-brand-red dark:text-slate-300 dark:hover:text-brand-red"
              >
                Iniciar sesión
              </button>

              <button
                type="button"
                onClick={handleRegister}
                className="block w-full py-2 text-left text-sm text-brand-gray transition-colors hover:text-brand-red dark:text-slate-300 dark:hover:text-brand-red"
              >
                Registrarse
              </button>

              <Link
                to="/ofertas"
                onClick={closeMenus}
                className="block py-2 text-sm text-brand-gray transition-colors hover:text-brand-red dark:text-slate-300 dark:hover:text-brand-red"
              >
                Ver ofertas
              </Link>
            </>
          )}
        </div>
      </div>
    )}
  </>
  );
}
