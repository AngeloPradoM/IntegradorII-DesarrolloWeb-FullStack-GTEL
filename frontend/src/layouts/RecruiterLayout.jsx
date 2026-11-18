import { Fragment, useState } from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  PlusSquare,
  Users,
  CalendarDays,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  FileCheck2,
  Trash2,
  Layers,
  LogOut,
  TicketCheck,
  BookOpen,
  Settings,
} from "lucide-react";
import Header from "../components/layout/Header";
import { useAuth } from "../context/AuthContext";
import "./recruiter-sidebar.css";

const ALLOWED_STAFF_ROLES = [
  "RECLUTADOR",
  "ADMIN",
  "JEFATURA_SOLICITANTE",
  "ANALISTA_RRHH",
  "ENTREVISTADOR"
];

const ROLE_METADATA = {
  RECLUTADOR: { label: "Reclutador Senior", tag: "bg-red-500/20 text-red-300", avatarBg: "bg-brand-red/40" },
  ADMIN: { label: "Administrador ATS", tag: "bg-slate-500/20 text-slate-300", avatarBg: "bg-slate-600" },
  JEFATURA_SOLICITANTE: { label: "Jefatura Solicitante", tag: "bg-blue-500/20 text-blue-300", avatarBg: "bg-blue-600" },
  ANALISTA_RRHH: { label: "Analista de RRHH", tag: "bg-purple-500/20 text-purple-300", avatarBg: "bg-purple-600" },
  ENTREVISTADOR: { label: "Entrevistador Técnico", tag: "bg-amber-500/20 text-amber-300", avatarBg: "bg-amber-600" },
};

const allNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/reclutador/dashboard", roles: ["RECLUTADOR", "ADMIN", "ANALISTA_RRHH", "JEFATURA_SOLICITANTE", "ENTREVISTADOR"] },
  { icon: FileCheck2, label: "Requerimientos", path: "/reclutador/requerimientos", roles: ["RECLUTADOR", "ADMIN", "JEFATURA_SOLICITANTE", "ANALISTA_RRHH"] },
  { icon: Briefcase, label: "Ofertas", path: "/reclutador/ofertas", roles: ["RECLUTADOR", "ADMIN", "ANALISTA_RRHH", "JEFATURA_SOLICITANTE"] },
  { icon: PlusSquare, label: "Publicar oferta", path: "/reclutador/publicar-oferta", roles: ["RECLUTADOR", "ADMIN"] },
  { icon: Trash2, label: "Papelera", path: "/reclutador/ofertas/papelera", roles: ["RECLUTADOR", "ADMIN"] },
  { icon: Users, label: "Postulantes", path: "/reclutador/postulantes", roles: ["RECLUTADOR", "ADMIN", "ANALISTA_RRHH", "ENTREVISTADOR", "JEFATURA_SOLICITANTE"] },
  { icon: Layers, label: "Selección", path: "/reclutador/seleccion", roles: ["RECLUTADOR", "ADMIN", "ANALISTA_RRHH"] },
  { icon: CalendarDays, label: "Entrevistas", path: "/reclutador/entrevistas", roles: ["RECLUTADOR", "ADMIN", "ANALISTA_RRHH", "ENTREVISTADOR"] },
  { icon: ClipboardList, label: "Evaluaciones", path: "/reclutador/evaluaciones", roles: ["RECLUTADOR", "ADMIN", "ENTREVISTADOR"] },
  { icon: TicketCheck, label: "Mesa de ayuda y cambios", path: "/reclutador/tickets", roles: ["RECLUTADOR", "ADMIN"] },
  { icon: BookOpen, label: "Guía de uso", path: "/reclutador/guia-uso", roles: ["RECLUTADOR", "ADMIN"] },
];

const routeContexts = [
  { match: path => path === "/reclutador/dashboard", group: "Panel principal", section: "Dashboard", icon: LayoutDashboard },
  { match: path => path === "/reclutador/requerimientos", group: "Reclutamiento", section: "Requerimientos", icon: FileCheck2 },
  { match: path => path === "/reclutador/publicar-oferta", group: "Reclutamiento", section: "Publicar oferta", icon: PlusSquare },
  { match: path => path === "/reclutador/ofertas/papelera", group: "Reclutamiento", section: "Papelera", icon: Trash2 },
  { match: path => /^\/reclutador\/ofertas\/[^/]+\/editar$/.test(path), group: "Reclutamiento", section: "Editar oferta", icon: Briefcase },
  { match: path => /^\/reclutador\/ofertas\/[^/]+$/.test(path), group: "Reclutamiento", section: "Detalle de oferta", icon: Briefcase },
  { match: path => path === "/reclutador/ofertas", group: "Reclutamiento", section: "Ofertas", icon: Briefcase },
  { match: path => /^\/reclutador\/postulantes\/[^/]+$/.test(path), group: "Candidatos", section: "Perfil de postulante", icon: Users },
  { match: path => path === "/reclutador/postulantes", group: "Candidatos", section: "Postulantes", icon: Users },
  { match: path => path === "/reclutador/seleccion", group: "Candidatos", section: "Selección", icon: Layers },
  { match: path => path === "/reclutador/entrevistas", group: "Seguimiento", section: "Entrevistas", icon: CalendarDays },
  { match: path => path === "/reclutador/evaluaciones", group: "Seguimiento", section: "Evaluaciones", icon: ClipboardList },
  { match: path => path === "/reclutador/tickets", group: "Asistencia", section: "Mesa de ayuda y cambios", icon: TicketCheck },
  { match: path => path === "/reclutador/guia-uso", group: "Asistencia", section: "Guía de uso", icon: BookOpen },
];

function getRouteContext(pathname) {
  return routeContexts.find(item => item.match(pathname)) || {
    group: "Reclutamiento",
    section: "Centro de trabajo",
    icon: Briefcase,
  };
}

function isNavigationActive(pathname, itemPath) {
  if (pathname === itemPath) return true;
  if (itemPath === "/reclutador/ofertas") {
    return pathname.startsWith("/reclutador/ofertas/") && pathname !== "/reclutador/ofertas/papelera";
  }
  return itemPath === "/reclutador/postulantes" && pathname.startsWith("/reclutador/postulantes/");
}

function getNavigationGroup(itemPath) {
  if (itemPath === "/reclutador/dashboard") return "Panel principal";
  if (["/reclutador/entrevistas", "/reclutador/evaluaciones"].includes(itemPath)) return "Evaluación y seguimiento";
  if (["/reclutador/tickets", "/reclutador/guia-uso"].includes(itemPath)) return "Asistencia";
  return "Reclutamiento";
}

export default function RecruiterLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!ALLOWED_STAFF_ROLES.includes(user?.rol) || !user?.token) {
    return <Navigate to="/" replace />;
  }

  const roleInfo = ROLE_METADATA[user?.rol] || {
    label: "Equipo GTEL",
    tag: "bg-slate-500/20 text-slate-300",
    avatarBg: "bg-brand-red/30"
  };
  const displayName = [user?.nombres, user?.apellidos].filter(Boolean).join(" ").trim() || user?.email || roleInfo.label;
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  const navItems = allNavItems.filter((item) => item.roles.includes(user?.rol));
  const routeContext = getRouteContext(location.pathname);
  const ContextIcon = routeContext.icon;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-app-bg font-sans text-app-primary">
      <a href="#contenido" className="skip-link">
        Saltar al contenido principal
      </a>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Cerrar overlay"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`recruiter-sidebar fixed left-0 top-0 z-40 flex h-full flex-col border-r border-app-border bg-app-surface text-app-primary shadow-lg lg:relative ${
          collapsed ? "w-16" : "w-64"
        } ${collapsed ? "is-collapsed" : ""} ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className={`recruiter-sidebar-brand flex items-center gap-3 border-b border-app-border px-4 py-5 ${collapsed ? "justify-center" : ""}`}>
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-app-action shadow-sm">
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          <div className="recruiter-sidebar-brand-copy min-w-0" aria-hidden={collapsed}>
              <div className="text-sm font-bold leading-tight">GTEL Talento</div>
              <div className="mt-1 max-w-40 truncate text-[11px] font-medium text-app-secondary" title={displayName}>{displayName}</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto px-2 py-4" aria-label="Navegación del reclutador">
          <div className="recruiter-location-shell">
            {collapsed ? (
              <div
                className="recruiter-location-compact"
                role="status"
                aria-label={`Ubicación actual: ${routeContext.group}, ${routeContext.section}`}
                data-tooltip={`${routeContext.group} · ${routeContext.section}`}
                title={`${routeContext.group} · ${routeContext.section}`}
              >
                <ContextIcon className="h-4 w-4" aria-hidden="true" />
              </div>
            ) : (
              <div key={location.pathname} className="recruiter-location-card" role="status" aria-live="polite">
                <span className="recruiter-location-marker" aria-hidden="true" />
                <div className="min-w-0">
                  <span className="recruiter-location-label">Ubicación actual</span>
                  <strong>{routeContext.group}</strong>
                  <span className="recruiter-location-section">{routeContext.section}</span>
                </div>
              </div>
            )}
          </div>

          {user.rol === "ADMIN" && (
            <Link
              className="recruiter-admin-return mb-2 flex min-h-11 items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-700 hover:border-amber-400 hover:bg-amber-100 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200 dark:hover:border-amber-300/40 dark:hover:bg-amber-400/20 dark:hover:text-white"
              to="/admin"
              aria-label={collapsed ? "Panel Administrador" : undefined}
              data-tooltip={collapsed ? "Panel Administrador" : undefined}
              title={collapsed ? "Panel Administrador" : undefined}
            >
              <Settings className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <span className="recruiter-nav-label" aria-hidden={collapsed}>Panel Administrador</span>
            </Link>
          )}
          {navItems.map(({ icon: Icon, label, path }, index) => {
            const active = isNavigationActive(location.pathname, path);
            const group = getNavigationGroup(path);
            const showGroup = index === 0 || getNavigationGroup(navItems[index - 1].path) !== group;
            return (
              <Fragment key={path}>
                {showGroup && <span className="recruiter-nav-group-label" aria-hidden="true">{group}</span>}
                <Link
                  to={path}
                  onClick={() => setMobileOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`recruiter-sidebar-link flex min-h-11 items-center gap-3 rounded-lg border px-3 py-2.5 ${
                    active
                      ? "border-red-400/40 bg-app-action text-white shadow-sm"
                      : "border-transparent text-app-body hover:border-app-border hover:bg-app-muted hover:text-app-primary"
                  } ${collapsed ? "justify-center" : ""}`}
                  aria-label={collapsed ? label : undefined}
                  data-tooltip={collapsed ? label : undefined}
                  title={collapsed ? label : undefined}
                >
                  <Icon className="recruiter-nav-icon h-5 w-5 flex-shrink-0" aria-hidden="true" />
                  <span className="recruiter-nav-label text-sm font-medium" aria-hidden={collapsed}>{label}</span>
                </Link>
              </Fragment>
            );
          })}
        </nav>

        <div className="hidden justify-end px-2 pb-2 lg:flex">
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="recruiter-sidebar-collapse rounded-lg border border-transparent p-1.5 text-app-secondary hover:border-app-border hover:bg-app-muted hover:text-app-primary"
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
            title={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <div className={`flex items-center gap-3 border-t border-app-border p-3 ${collapsed ? "justify-center" : ""}`}>
          <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${roleInfo.avatarBg} text-xs font-bold`}>
            {initials || "U"}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold" title={displayName}>{displayName}</div>
                <div className="truncate text-[10px] text-app-secondary">{roleInfo.label}</div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md p-1 text-app-secondary transition-colors hover:bg-app-muted hover:text-app-primary"
                aria-label="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          user={user}
          variant="recruiter"
          isMobileOpen={mobileOpen}
          onToggleSidebar={() => setMobileOpen((open) => !open)}
          onLogout={handleLogout}
        />

        <main id="contenido" className="flex-1 overflow-y-auto [&>div]:mx-auto [&>div]:max-w-7xl">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
