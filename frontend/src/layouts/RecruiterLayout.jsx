import { useState } from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, PlusSquare, Users, CalendarDays, ClipboardList,
  Search, Bell, ChevronLeft, ChevronRight, Briefcase, LogOut, Menu, X,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/reclutador/dashboard" },
  { icon: PlusSquare, label: "Publicar Oferta", path: "/reclutador/publicar-oferta" },
  { icon: Users, label: "Postulantes", path: "/reclutador/postulantes" },
  { icon: CalendarDays, label: "Entrevistas", path: "/reclutador/entrevistas" },
  { icon: ClipboardList, label: "Evaluaciones", path: "/reclutador/evaluaciones" },
];

export default function RecruiterLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("gtel-user") || "null");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (user?.rol !== "RECLUTADOR" || !user?.token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-brand-bg font-sans overflow-hidden">
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative z-40 h-full bg-brand-navy text-white flex flex-col transition-all duration-300
          ${collapsed ? "w-16" : "w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/10 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-9 h-9 bg-brand-red rounded-lg flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <div className="text-sm font-bold leading-tight">GTEL Talento</div>
              <div className="text-[10px] text-white/50 uppercase tracking-wide">Reclutador</div>
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {navItems.map(({ icon: Icon, label, path }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                  ${active ? "bg-brand-red text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}
                  ${collapsed ? "justify-center" : ""}`}
                title={collapsed ? label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:flex justify-end px-2 pb-2">
          <button onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <div className={`border-t border-white/10 p-3 flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-full bg-brand-red/30 flex items-center justify-center flex-shrink-0 text-xs font-bold">
            {(user.nombres || user.email || "R").slice(0, 2).toUpperCase()}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate">{user.nombres || user.email}</div>
                <div className="text-[10px] text-white/50 truncate">Reclutador</div>
              </div>
              <button onClick={() => { localStorage.removeItem("gtel-user"); navigate("/login"); }} className="text-white/40 hover:text-white transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white border-b border-gray-100 px-4 lg:px-6 py-3 flex items-center gap-4 flex-shrink-0">
          <button className="lg:hidden text-brand-navy" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Buscar candidatos, ofertas..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-brand-bg border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red" />
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button className="relative p-2 rounded-lg text-brand-gray hover:bg-gray-100 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-brand-red rounded-full" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-red/20 border-2 border-brand-red/20 flex items-center justify-center text-xs font-bold text-brand-red">
                {(user.nombres || user.email || "R").slice(0, 2).toUpperCase()}
              </div>
              <span className="hidden md:block text-sm font-medium text-brand-navy">{user.nombres || user.email}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}