import { useEffect, useState } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { BriefcaseBusiness, ChevronLeft, Layers3, LogOut, Menu, Search, Ticket, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ui/ThemeToggle';
import NotificationBell from '../components/layout/NotificationBell';

export default function TechnicianLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [location.pathname, searchParams]);
  useEffect(() => {
    if (!menuOpen) return undefined;
    const closeOnEscape = event => { if (event.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  if (user?.rol !== 'TECNICO' || !user?.token) return <Navigate to="/" replace />;

  const displayName = [user?.nombres, user?.apellidos].filter(Boolean).join(' ').trim() || user.email;
  const initials = displayName.split(/\s+/).slice(0, 2).map(value => value[0]).join('').toUpperCase();
  const activeQueue = searchParams.get('queue') === 'changes' ? 'changes' : 'support';
  const search = searchParams.get('q') || '';

  const updateSearch = value => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('q', value);
    else next.delete('q');
    setSearchParams(next, { replace: true });
  };
  const queueHref = queue => {
    const next = new URLSearchParams(searchParams);
    next.set('queue', queue);
    return `/tecnico/tickets?${next.toString()}`;
  };
  const exit = () => {
    logout();
    navigate('/', { replace: true });
  };

  const navigation = (
    <nav aria-label="Navegación técnica" className="space-y-2">
      <Link to={queueHref('support')} aria-current={activeQueue === 'support' ? 'page' : undefined} className={`technician-nav-link ${activeQueue === 'support' ? 'is-active' : ''}`}>
        <Ticket className="h-5 w-5" aria-hidden="true" />
        Tickets
      </Link>
      <Link to={queueHref('changes')} aria-current={activeQueue === 'changes' ? 'page' : undefined} className={`technician-nav-link ${activeQueue === 'changes' ? 'is-active' : ''}`}>
        <Layers3 className="h-5 w-5" aria-hidden="true" />
        RFC (Cambios)
      </Link>
    </nav>
  );

  return (
    <div className="min-h-dvh bg-app-bg text-app-primary lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      <aside className="technician-sidebar sticky top-0 hidden h-dvh self-start flex-col lg:flex">
        <Link to={queueHref('support')} className="flex items-center gap-3 border-b border-white/10 px-6 py-5" aria-label="GTEL Talento, soporte técnico">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-app-action text-white shadow-lg shadow-red-950/20">
            <BriefcaseBusiness className="h-6 w-6" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <strong className="block truncate text-base text-white">GTEL Talento</strong>
            <small className="block truncate text-sm text-slate-300">Soporte Técnico</small>
          </span>
        </Link>

        <div className="px-4 py-7">{navigation}</div>

        <div className="mt-auto border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-xl p-2 text-white">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-700 text-xs font-black">{initials}</span>
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-xs">{displayName}</strong>
              <small className="block truncate text-[11px] text-slate-400">{user.email}</small>
              <small className="block truncate text-[11px] text-slate-400">Soporte Técnico</small>
            </span>
            <button type="button" onClick={exit} className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white" aria-label="Cerrar sesión">
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="technician-topbar sticky top-0 z-40 flex min-h-[68px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:flex-nowrap lg:px-7">
          <button type="button" aria-label={menuOpen ? 'Cerrar menú técnico' : 'Abrir menú técnico'} aria-expanded={menuOpen} aria-controls="technician-mobile-menu" onClick={() => setMenuOpen(value => !value)} className="technical-button-secondary rounded-lg p-2.5 lg:hidden">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link to={queueHref('support')} className="flex items-center gap-2 lg:hidden" aria-label="GTEL Talento, soporte técnico">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-app-action text-white"><BriefcaseBusiness className="h-4 w-4" /></span>
            <strong className="hidden text-sm sm:block">GTEL Talento</strong>
          </Link>

          <label className="relative order-last w-full lg:order-none lg:max-w-[520px]">
            <span className="sr-only">Buscar ticket por código, título o solicitante</span>
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-app-secondary" aria-hidden="true" />
            <input value={search} onChange={event => updateSearch(event.target.value)} className="technical-top-search w-full py-2.5 pl-12 pr-4 text-sm" placeholder="Buscar ticket (código, título o solicitante)..." />
          </label>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <NotificationBell />
            <span className="grid h-10 w-10 place-items-center rounded-full border border-app-border-strong bg-app-muted text-xs font-black text-app-primary" title={displayName}>{initials}</span>
          </div>
        </header>

        {menuOpen && (
          <div className="fixed inset-0 z-30 bg-slate-950/60 pt-[68px] lg:hidden" onMouseDown={() => setMenuOpen(false)}>
            <aside id="technician-mobile-menu" className="technician-sidebar flex h-full w-[min(86vw,320px)] flex-col p-4 shadow-2xl" onMouseDown={event => event.stopPropagation()}>
              <div className="mb-6 flex items-center gap-3 border-b border-white/10 pb-5 text-white">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-red-700 text-xs font-black">{initials}</span>
                <span className="min-w-0"><strong className="block truncate text-sm">{displayName}</strong><small className="block truncate text-xs text-slate-400">{user.email}</small></span>
              </div>
              {navigation}
              <button type="button" onClick={exit} className="mt-auto flex items-center justify-center gap-2 rounded-xl border border-white/15 px-3 py-2.5 text-sm font-bold text-white hover:bg-white/10">
                <LogOut className="h-4 w-4" aria-hidden="true" />Cerrar sesión
              </button>
            </aside>
          </div>
        )}

        <main id="contenido" className="min-w-0"><Outlet /></main>
      </div>
    </div>
  );
}
