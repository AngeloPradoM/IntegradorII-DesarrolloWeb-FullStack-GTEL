import { useState } from "react";
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
  Clock,
} from "lucide-react";
import Header from "../components/layout/Header";
import { useAuth } from "../context/AuthContext";

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
  { icon: TicketCheck, label: "Solicitar ticket", path: "/reclutador/tickets", roles: ["RECLUTADOR", "ADMIN"] },
  { icon: Clock, label: "Tablero SLA", path: "/reclutador/tablero-sla", roles: ["RECLUTADOR", "ADMIN"] },
  { icon: BookOpen, label: "Guía de uso", path: "/reclutador/guia-uso", roles: ["RECLUTADOR", "ADMIN"] },
];

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

  const navItems = allNavItems.filter((item) => item.roles.includes(user?.rol));

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-brand-bg font-sans dark:bg-slate-950 dark:text-slate-100">
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
        className={`fixed left-0 top-0 z-40 flex h-full flex-col bg-brand-navy dark:bg-slate-900 dark:border-r dark:border-slate-800 text-white transition-all duration-300 ease-in-out lg:relative ${
          collapsed ? "w-16" : "w-64"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className={`flex items-center gap-3 border-b border-white/10 px-4 py-5 ${collapsed ? "justify-center" : ""}`}>
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-red">
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <div className="text-sm font-bold leading-tight">GTEL Talento</div>
              <div className="text-xs uppercase tracking-wide text-white/50">{roleInfo.label}</div>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {user.rol === "ADMIN" && (
            <Link className="block p-3 text-xs font-semibold text-amber-300 hover:text-white" to="/admin">
              ⚙️ Panel Administrador
            </Link>
          )}
          {navItems.map(({ icon: Icon, label, path }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
                  active ? "bg-brand-red text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                } ${collapsed ? "justify-center" : ""}`}
                title={collapsed ? label : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="hidden justify-end px-2 pb-2 lg:flex">
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <div className={`flex items-center gap-3 border-t border-white/10 p-3 ${collapsed ? "justify-center" : ""}`}>
          <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${roleInfo.avatarBg} text-xs font-bold`}>
            {(user.nombres || user.email || "U").slice(0, 2).toUpperCase()}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold">{user.nombres || user.email}</div>
                <div className="truncate text-[10px] text-white/50">{roleInfo.label}</div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="text-white/40 transition-colors hover:text-white"
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
