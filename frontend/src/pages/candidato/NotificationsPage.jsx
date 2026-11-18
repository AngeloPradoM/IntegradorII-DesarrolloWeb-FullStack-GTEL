import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Bell, CalendarDays, CheckCheck, ChevronRight, ClipboardList,
  ExternalLink, FileClock, Headphones, Inbox, LoaderCircle, RefreshCw, Search, UserPlus,
} from 'lucide-react';
import { request } from '../../services/workflowService';
import '../admin/admin-workspace.css';
import './notifications-page.css';

const filters = [['all', 'Todas'], ['unread', 'Sin leer'], ['read', 'Leídas']];
const routePatterns = [
  /^\/$/, /^\/notificaciones$/,
  /^\/(?:ofertas|mis-postulaciones|perfil)(?:\/[^/?#]+)?$/,
  /^\/admin(?:\/(?:usuarios|auditoria|tickets|tablero-sla))?$/,
  /^\/reclutador\/(?:dashboard|requerimientos|publicar-oferta|postulantes|entrevistas|evaluaciones|seleccion|tickets|guia-uso|tablero-sla)(?:\/[^/?#]+)?$/,
  /^\/reclutador\/ofertas(?:\/papelera|\/[^/?#]+(?:\/editar)?)?$/,
  /^\/tecnico\/tickets$/,
];
const notificationVisuals = {
  SOPORTE_TICKET: { label: 'Soporte técnico', module: 'Mesa de ayuda', Icon: Headphones },
  GESTION_CAMBIO: { label: 'Gestión de cambios RFC', module: 'Gestión de cambios', Icon: FileClock },
  POSTULACION_NUEVA: { label: 'Postulaciones', module: 'Postulaciones', Icon: UserPlus },
  POSTULACION_ESTADO: { label: 'Postulaciones', module: 'Postulaciones', Icon: UserPlus },
  ENTREVISTA_PROGRAMADA: { label: 'Entrevistas', module: 'Entrevistas', Icon: CalendarDays },
  REQUERIMIENTO_ESTADO: { label: 'Requerimientos', module: 'Requerimientos', Icon: ClipboardList },
  SISTEMA: { label: 'Sistema', module: 'Sistema', Icon: Bell },
};

function normalizeNotification(row) {
  return {
    id: row.id,
    title: String(row.title ?? row.titulo ?? 'Notificación'),
    description: String(row.description ?? row.mensaje ?? ''),
    type: String(row.type ?? row.tipo ?? 'SISTEMA'),
    link: String(row.link ?? row.enlace ?? ''),
    read: Boolean(row.read ?? row.leida),
    createdAt: String(row.createdAt ?? row.fecha ?? ''),
  };
}

function humanizeType(type) {
  if (notificationVisuals[type]) return notificationVisuals[type];
  const label = type.toLowerCase().replaceAll('_', ' ').replace(/(^|\s)\S/g, letter => letter.toUpperCase());
  return { label: label || 'Otro evento', module: label || 'Otro evento', Icon: Bell };
}

function extractReference(row) {
  return `${row.title} ${row.description}`.match(/\b(?:RFC|SR|INC|TKT|REQ|POST|APP|OFERTA)-[A-Z0-9-]+\b/i)?.[0] || '';
}

function validRelatedRoute(link) {
  if (!link?.startsWith('/') || link.startsWith('//')) return '';
  const path = link.split(/[?#]/, 1)[0].replace(/\/$/, '') || '/';
  return routePatterns.some(pattern => pattern.test(path)) ? link : '';
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setRows(null);
    request('/api/notifications', { signal: controller.signal })
      .then(response => {
        if (!active) return;
        const nextRows = Array.isArray(response) ? response.map(normalizeNotification) : [];
        setRows(nextRows);
        setSelectedId(current => nextRows.some(row => String(row.id) === String(current)) ? current : null);
        setError('');
      })
      .catch(failure => {
        if (active && failure.name !== 'AbortError') setError(failure.message);
      });
    return () => { active = false; controller.abort(); };
  }, [revision]);

  const unreadCount = useMemo(() => (rows || []).filter(row => !row.read).length, [rows]);
  const typeOptions = useMemo(() => [...new Set((rows || []).map(row => row.type))], [rows]);
  const visible = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('es');
    return (rows || []).filter(row => {
      const matchesState = filter === 'all' || (filter === 'unread' ? !row.read : row.read);
      const matchesType = typeFilter === 'all' || row.type === typeFilter;
      const searchable = `${row.title} ${row.description}`.toLocaleLowerCase('es');
      return matchesState && matchesType && (!term || searchable.includes(term));
    });
  }, [filter, query, rows, typeFilter]);
  const selected = useMemo(
    () => (rows || []).find(row => String(row.id) === String(selectedId)) || null,
    [rows, selectedId],
  );

  const refresh = () => {
    if (busy) return;
    setError(''); setNotice(''); setRevision(value => value + 1);
  };

  async function markRead(row) {
    if (busy || !row || row.read) return;
    setBusy(String(row.id)); setError(''); setNotice('');
    try {
      await request(`/api/notifications/${encodeURIComponent(row.id)}/read`, { method: 'PUT' });
      setRows(items => items?.map(item => String(item.id) === String(row.id) ? { ...item, read: true } : item) || []);
      setNotice('La notificación se marcó como leída.');
      window.dispatchEvent(new Event('gtel:notifications-changed'));
    } catch (failure) { setError(failure.message); }
    finally { setBusy(''); }
  }

  async function markAllRead() {
    if (busy || !unreadCount) return;
    setBusy('all'); setError(''); setNotice('');
    try {
      await request('/api/notifications/read-all', { method: 'PUT' });
      setRows(items => items?.map(item => ({ ...item, read: true })) || []);
      setNotice('Todas las notificaciones se marcaron como leídas.');
      window.dispatchEvent(new Event('gtel:notifications-changed'));
    } catch (failure) { setError(failure.message); }
    finally { setBusy(''); }
  }

  const chooseNotification = id => { setSelectedId(id); setMobileDetailOpen(true); };
  const hasActiveFilters = filter !== 'all' || typeFilter !== 'all' || query.trim();
  const isLoading = rows === null && !error;

  return (
    <main className="admin-workspace admin-workspace-wide notifications-page">
      <div className="page-heading notification-page-heading">
        <div><p className="eyebrow">Centro de actividad</p><h1>Mis notificaciones</h1><p className="subtitle">Mantente al día y organiza los avisos que requieren tu atención.</p></div>
        <div className="button-group">
          <button type="button" className="btn" disabled={Boolean(busy)} onClick={refresh}><RefreshCw size={15} className={isLoading ? 'is-spinning' : ''} aria-hidden="true" />Actualizar</button>
          <button type="button" className="btn btn-primary" disabled={Boolean(busy) || !unreadCount} onClick={markAllRead}>
            {busy === 'all' ? <LoaderCircle size={15} className="is-spinning" aria-hidden="true" /> : <CheckCheck size={15} aria-hidden="true" />}
            {busy === 'all' ? 'Actualizando…' : 'Marcar todas como leídas'}
          </button>
        </div>
      </div>

      <section className="notification-summary" aria-label="Resumen de notificaciones">
        <article className="notification-summary-card"><span className="notification-summary-icon is-unread"><Bell aria-hidden="true" /></span><div><span>Notificaciones sin leer</span><strong>{unreadCount}</strong><small>Requieren tu atención</small></div></article>
        <article className="notification-summary-card"><span className="notification-summary-icon is-read"><CheckCheck aria-hidden="true" /></span><div><span>Notificaciones leídas</span><strong>{(rows?.length || 0) - unreadCount}</strong><small>Ya fueron revisadas</small></div></article>
      </section>

      {error && <div role="alert" className="alert">{error}<button type="button" disabled={Boolean(busy)} className="btn" onClick={refresh}>Reintentar</button></div>}
      <p className="notification-live-region" role="status" aria-live="polite">{notice}</p>

      <section className="surface notification-controls" aria-label="Filtros de notificaciones">
        <div className="filter-tabs" aria-label="Estado de lectura">
          {filters.map(([id, label]) => <button type="button" key={id} aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}{id === 'unread' && rows ? ` (${unreadCount})` : ''}</button>)}
        </div>
        <div className="notification-control-fields">
          <div className="search-field"><Search aria-hidden="true" /><input type="search" aria-label="Buscar notificaciones" placeholder="Buscar por título o descripción…" value={query} onChange={event => setQuery(event.target.value)} /></div>
          {typeOptions.length > 1 && <select className="toolbar-select" aria-label="Filtrar por tipo de notificación" value={typeFilter} onChange={event => setTypeFilter(event.target.value)}><option value="all">Todos los tipos</option>{typeOptions.map(type => <option value={type} key={type}>{humanizeType(type).label}</option>)}</select>}
        </div>
      </section>

      <section className={`surface notification-inbox-grid${mobileDetailOpen ? ' is-mobile-detail' : ''}`} aria-label="Bandeja de notificaciones">
        <div className="notification-list-pane">
          <header className="notification-pane-heading"><div><p className="eyebrow">Bandeja</p><h2>Actividad reciente</h2></div><span>{rows ? `${visible.length} ${visible.length === 1 ? 'registro' : 'registros'}` : error ? 'No disponible' : 'Cargando…'}</span></header>
          <div className="notification-list" aria-label="Listado de notificaciones" aria-busy={isLoading}>
            {rows === null && !error && <div className="notification-state" role="status"><LoaderCircle className="is-spinning" aria-hidden="true" /><strong>Cargando notificaciones…</strong></div>}
            {rows && rows.length === 0 && <div className="notification-state"><Inbox aria-hidden="true" /><strong>No tienes notificaciones disponibles.</strong><span>Los nuevos avisos aparecerán en esta bandeja.</span></div>}
            {rows && rows.length > 0 && visible.length === 0 && <div className="notification-state"><Search aria-hidden="true" /><strong>No se encontraron notificaciones con los filtros seleccionados.</strong>{hasActiveFilters && <span>Prueba con otros criterios de búsqueda.</span>}</div>}
            {visible.map(row => {
              const { Icon, label } = humanizeType(row.type);
              const isSelected = String(row.id) === String(selectedId);
              return <button type="button" className={`notification-list-item${row.read ? ' is-read' : ' is-unread'}`} aria-pressed={isSelected} aria-label={`${row.title}. ${row.read ? 'Leída' : 'Sin leer'}`} key={row.id} onClick={() => chooseNotification(row.id)}>
                <span className="notification-event-icon"><Icon aria-hidden="true" /></span>
                <span className="notification-list-copy"><span className="notification-item-meta"><span>{label}</span><time>{row.createdAt || 'Fecha no disponible'}</time></span><strong>{row.title}</strong><span className="notification-excerpt">{row.description || 'Sin descripción adicional.'}</span><span className="notification-read-state">{!row.read && <i aria-hidden="true" />} {row.read ? 'Leída' : 'Sin leer'}</span></span>
                <ChevronRight className="notification-item-chevron" aria-hidden="true" />
              </button>;
            })}
          </div>
        </div>
        <div className="notification-detail-pane">
          {selected ? <NotificationDetail row={selected} busy={busy} onBack={() => setMobileDetailOpen(false)} onMarkRead={() => markRead(selected)} onNavigate={path => navigate(path)} /> : <div className="notification-detail-empty"><span><Bell aria-hidden="true" /></span><strong>Selecciona una notificación para consultar sus detalles.</strong><p>Podrás revisar toda la información y las acciones disponibles sin salir de la bandeja.</p></div>}
        </div>
      </section>
    </main>
  );
}

function NotificationDetail({ row, busy, onBack, onMarkRead, onNavigate }) {
  const { Icon, label, module } = humanizeType(row.type);
  const reference = extractReference(row);
  const relatedRoute = validRelatedRoute(row.link);
  return <article className="notification-detail">
    <button type="button" className="notification-mobile-back" onClick={onBack}><ArrowLeft size={17} aria-hidden="true" />Volver a la bandeja</button>
    <header className="notification-detail-header"><span className="notification-detail-icon"><Icon aria-hidden="true" /></span><div><p className="eyebrow">{label}</p><h2>{row.title}</h2><span className={`notification-status-badge${row.read ? ' is-read' : ' is-unread'}`}><i aria-hidden="true" />{row.read ? 'Leída' : 'Sin leer'}</span></div></header>
    <div className="notification-detail-content"><section aria-labelledby="notification-message-heading"><h3 id="notification-message-heading">Información</h3><p>{row.description || 'Esta notificación no contiene una descripción adicional.'}</p></section><dl className="notification-detail-data"><div><dt>Fecha y hora</dt><dd>{row.createdAt || 'No disponible'}</dd></div><div><dt>Módulo relacionado</dt><dd>{module}</dd></div>{reference && <div><dt>Referencia</dt><dd>{reference}</dd></div>}<div><dt>Estado</dt><dd>{row.read ? 'Leída' : 'Sin leer'}</dd></div></dl></div>
    <footer className="notification-detail-actions">{!row.read && <button type="button" className="btn btn-primary" disabled={Boolean(busy)} onClick={onMarkRead}>{busy === String(row.id) ? <LoaderCircle size={15} className="is-spinning" aria-hidden="true" /> : <CheckCheck size={15} aria-hidden="true" />}{busy === String(row.id) ? 'Actualizando…' : 'Marcar como leída'}</button>}{relatedRoute && <button type="button" className="btn" disabled={Boolean(busy)} onClick={() => onNavigate(relatedRoute)}><ExternalLink size={15} aria-hidden="true" />Ir al módulo relacionado</button>}</footer>
  </article>;
}
