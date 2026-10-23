import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  ExternalLink,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  Settings,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { request } from '../../services/workflowService';
import ThemeToggle from '../ui/ThemeToggle';
import './admin-header.css';

const primaryNavigation = [
  { to: '/admin', label: 'Inicio', icon: LayoutDashboard, end: true },
  { to: '/admin/auditoria', label: 'Auditoría', icon: ScrollText },
  { to: '/notificaciones', label: 'Notificaciones', icon: Bell, notifications: true },
  { to: '/ofertas', label: 'Ofertas', icon: BriefcaseBusiness },
  { to: '/admin/tickets', label: 'Mesa de ayuda', icon: HelpCircle },
];

const perspectiveNavigation = [
  { to: '/mis-postulaciones', label: 'Vista candidato', icon: UserRound },
  { to: '/reclutador/dashboard', label: 'Vista reclutador', icon: UsersRound },
];

export default function AdminHeader() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationState, setNotificationState] = useState(null);
  const headerRef = useRef(null);
  const profileAreaRef = useRef(null);
  const profileButtonRef = useRef(null);
  const menuButtonRef = useRef(null);

  useEffect(() => {
    const closeOutside = event => {
      if (!profileAreaRef.current?.contains(event.target)) setProfileOpen(false);
      if (!headerRef.current?.contains(event.target)) setMobileOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, []);

  useEffect(() => {
    let active = true;
    let controller;
    const refresh = () => {
      controller?.abort();
      controller = new AbortController();
      request('/api/notifications', { signal: controller.signal })
        .then(rows => {
          if (active && Array.isArray(rows)) {
            setNotificationState({ token: user.token, count: rows.filter(row => !row.leida).length });
          }
        })
        .catch(() => {
          if (active && !controller.signal.aborted) setNotificationState(null);
        });
    };
    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('gtel:notifications-changed', refresh);
    return () => {
      active = false;
      controller?.abort();
      window.removeEventListener('focus', refresh);
      window.removeEventListener('gtel:notifications-changed', refresh);
    };
  }, [pathname, user.token]);

  const unreadCount = notificationState?.token === user.token ? notificationState.count : null;
  const displayName = [user.nombres, user.apellidos].filter(Boolean).join(' ') || 'Administrador';
  const closeMenus = () => {
    setMobileOpen(false);
    setProfileOpen(false);
  };
  const signOut = () => {
    closeMenus();
    logout();
    navigate('/', { replace: true });
  };

  const navigationLink = item => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.to}
        end={item.end}
        to={item.to}
        className="admin-nav-link"
        onClick={closeMenus}
        title={item.notifications && unreadCount === null ? 'Contador de notificaciones no disponible' : undefined}
      >
        <Icon size={16} aria-hidden="true" />
        <span>{item.label}</span>
        {item.notifications && unreadCount > 0 && (
          <span className="admin-unread" aria-label={`${unreadCount} notificaciones sin leer`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </NavLink>
    );
  };

  return (
    <header
      className="admin-header"
      ref={headerRef}
      onKeyDown={event => {
        if (event.key !== 'Escape') return;
        if (profileOpen) {
          setProfileOpen(false);
          profileButtonRef.current?.focus();
        } else if (mobileOpen) {
          setMobileOpen(false);
          menuButtonRef.current?.focus();
        }
      }}
    >
      <div className="admin-header-inner">
        <Link to="/admin" className="admin-brand" onClick={closeMenus} aria-label="GTEL Talento, panel de administración">
          <span className="admin-brand-icon"><BriefcaseBusiness size={21} /></span>
          <span className="admin-brand-copy"><strong>GTEL Talento</strong><small>Centro administrativo</small></span>
        </Link>

        <nav id="admin-navigation" aria-label="Navegación administrativa" className={`admin-navigation${mobileOpen ? ' is-open' : ''}`}>
          <span className="admin-nav-section-label">Gestión</span>
          <div className="admin-nav-group">{primaryNavigation.map(navigationLink)}</div>
          <span className="admin-nav-divider" aria-hidden="true" />
          <span className="admin-nav-section-label">Perspectivas</span>
          <div className="admin-nav-group admin-perspectives">
            {perspectiveNavigation.map(item => {
              const Icon = item.icon;
              return (
                <NavLink key={item.to} to={item.to} className="admin-nav-link admin-perspective" onClick={closeMenus}>
                  <Icon size={16} aria-hidden="true" /><span>{item.label}</span><ExternalLink size={13} className="admin-external" aria-hidden="true" />
                </NavLink>
              );
            })}
          </div>
        </nav>

        <div className="admin-actions">
          <ThemeToggle />
          <div ref={profileAreaRef} className="admin-profile" onBlur={event => {
            if (!event.currentTarget.contains(event.relatedTarget)) setProfileOpen(false);
          }}>
            <button
              ref={profileButtonRef}
              className="admin-profile-trigger"
              type="button"
              aria-expanded={profileOpen}
              aria-controls="admin-profile-options"
              aria-label={`Perfil de ${displayName}`}
              onClick={() => {
                setProfileOpen(value => !value);
                setMobileOpen(false);
              }}
            >
              <span className="admin-avatar">{user.foto ? <img src={user.foto} alt="" /> : <UserRound size={18} />}</span>
              <span className="admin-profile-name">{displayName}<small>Administrador</small></span>
              <ChevronDown size={15} aria-hidden="true" />
            </button>
            {profileOpen && (
              <div id="admin-profile-options" className="admin-profile-options">
                <p><strong>{displayName}</strong><span>{user.email}</span></p>
                <Link to="/perfil" onClick={closeMenus}><Settings size={16} />Ajustes de perfil</Link>
                <button type="button" onClick={signOut}><LogOut size={16} />Cerrar sesión</button>
              </div>
            )}
          </div>
          <button
            ref={menuButtonRef}
            type="button"
            className="admin-menu-toggle"
            aria-controls="admin-navigation"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Cerrar menú de administración' : 'Abrir menú de administración'}
            onClick={() => {
              setMobileOpen(value => !value);
              setProfileOpen(false);
            }}
          >
            {mobileOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>
    </header>
  );
}
