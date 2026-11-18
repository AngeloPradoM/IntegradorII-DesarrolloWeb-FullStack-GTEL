import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, ArrowRight, Bell, Clock3, FileCheck2, Headphones, RefreshCw, ScrollText, UserPlus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { listUsers } from '../../services/adminService';
import { listChangeRequests } from '../../services/changeManagementService';
import { getAdminSupportSlaDashboard, listSupportTickets } from '../../services/supportService';
import { request } from '../../services/workflowService';
import './admin-workspace.css';

const settledValue = (result, fallback) => result.status === 'fulfilled' ? result.value : fallback;
const formatDate = value => {
  if (!value) return 'Fecha no disponible';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Lima' }).format(date);
};

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    Promise.allSettled([
      listUsers('', 0, controller.signal),
      listSupportTickets(controller.signal),
      getAdminSupportSlaDashboard(controller.signal),
      listChangeRequests(controller.signal),
      request('/api/notifications', { signal: controller.signal }),
      request('/api/admin/audit?page=0', { signal: controller.signal }),
    ]).then(results => {
      if (!active) return;
      const unavailable = results.map((result, index) => result.status === 'rejected' && result.reason?.name !== 'AbortError' ? index : null).filter(value => value !== null);
      setData({
        users: settledValue(results[0], null),
        tickets: settledValue(results[1], []),
        sla: settledValue(results[2], []),
        changes: settledValue(results[3], []),
        notifications: settledValue(results[4], []),
        audit: settledValue(results[5], null),
        unavailable,
      });
    });
    return () => { active = false; controller.abort(); };
  }, [revision]);

  const summary = useMemo(() => {
    const tickets = Array.isArray(data?.tickets) ? data.tickets : [];
    const changes = Array.isArray(data?.changes) ? data.changes : [];
    const notifications = Array.isArray(data?.notifications) ? data.notifications : [];
    const sla = Array.isArray(data?.sla) ? data.sla : [];
    return {
      users: data?.users?.total,
      pendingTickets: tickets.filter(row => !['RESUELTO', 'CERRADO'].includes(row.status)).length,
      pendingChanges: changes.filter(row => row.status === 'PENDIENTE_APROBACION').length,
      unread: notifications.filter(row => !(row.leida ?? row.read)).length,
      overdue: sla.filter(row => row.slaStatus === 'VENCIDO').length,
      unassigned: tickets.filter(row => !row.technicianId).length,
      pendingProposals: tickets.filter(row => row.proposalStatus === 'PENDIENTE').length,
    };
  }, [data]);

  const attention = useMemo(() => [
    { label: 'Tickets sin asignar', value: summary.unassigned, to: '/admin/tickets', tone: summary.unassigned ? 'danger' : 'success' },
    { label: 'Solicitudes vencidas', value: summary.overdue, to: '/admin/tablero-sla', tone: summary.overdue ? 'danger' : 'success' },
    { label: 'Propuestas por autorizar', value: summary.pendingProposals, to: '/admin/tickets', tone: summary.pendingProposals ? 'warning' : 'success' },
    { label: 'RFC que requieren revisión', value: summary.pendingChanges, to: '/admin/tickets?queue=changes', tone: summary.pendingChanges ? 'warning' : 'success' },
  ], [summary]);

  const activity = data?.audit?.items || [];
  const metricCards = [
    [Users, 'Usuarios registrados', summary.users],
    [Headphones, 'Tickets pendientes', summary.pendingTickets],
    [FileCheck2, 'RFC por aprobar', summary.pendingChanges],
    [Bell, 'Notificaciones sin leer', summary.unread],
  ];

  return <main className="admin-workspace admin-workspace-wide">
    <div className="page-heading">
      <div><p className="eyebrow">Resumen ejecutivo</p><h1>Centro de control</h1><p className="subtitle">Supervisa la operación administrativa y prioriza las acciones que requieren intervención.</p></div>
      <button className="btn" type="button" onClick={() => { setData(null); setRevision(value => value + 1); }}><RefreshCw size={15}/>Actualizar</button>
    </div>

    <section className="metric-grid" aria-label="Indicadores principales">
      {metricCards.map(([Icon, label, value], index) => <article key={label} className="metric-card"><span className={`metric-icon ${index === 1 ? 'blue' : index === 2 ? 'violet' : index === 3 ? 'success' : ''}`}><Icon/></span><div><span className="metric-label">{label}</span><strong className="metric-value">{data ? value ?? 'N/D' : '—'}</strong><small>{value === undefined && data ? 'Fuente no disponible' : 'Dato actual del sistema'}</small></div></article>)}
    </section>

    {data?.unavailable.length > 0 && <div role="status" className="alert"><span><AlertTriangle size={16}/>Algunos indicadores no están disponibles. Las secciones operativas siguen accesibles.</span></div>}

    <section className="surface executive-panel quick-actions" aria-labelledby="quick-actions-title">
      <header className="panel-heading"><div><p className="eyebrow">Operación</p><h2 id="quick-actions-title">Acciones rápidas</h2></div><Clock3 size={19}/></header>
      <div className="quick-action-grid">
        <Link to="/admin/usuarios"><UserPlus/><span><strong>Registrar usuario</strong><small>Crear y administrar cuentas</small></span></Link>
        <Link to="/admin/auditoria"><ScrollText/><span><strong>Consultar auditoría</strong><small>Revisar trazabilidad</small></span></Link>
        <Link to="/admin/tickets"><Headphones/><span><strong>Gestionar soporte</strong><small>Asignar y autorizar tickets</small></span></Link>
        <Link to="/admin/tickets?queue=changes"><FileCheck2/><span><strong>Revisar RFC</strong><small>Evaluar cambios pendientes</small></span></Link>
        <Link to="/admin/tablero-sla"><Clock3/><span><strong>Consultar SLA</strong><small>Supervisar cumplimiento</small></span></Link>
      </div>
    </section>

    <div className="admin-dashboard-grid">
      <section className="surface executive-panel" aria-labelledby="attention-title">
        <header className="panel-heading"><div><p className="eyebrow">Prioridades</p><h2 id="attention-title">Atención requerida</h2></div><AlertTriangle size={19}/></header>
        <div className="attention-list">
          {attention.map(item => <Link key={item.label} to={item.to} className="attention-item"><span className={`status-dot ${item.tone}`} aria-hidden="true"/><span><strong>{item.label}</strong><small>{data ? `${item.value} registro${item.value === 1 ? '' : 's'}` : 'Consultando…'}</small></span><ArrowRight size={16}/></Link>)}
        </div>
      </section>

      <section className="surface executive-panel" aria-labelledby="activity-title">
        <header className="panel-heading"><div><p className="eyebrow">Trazabilidad</p><h2 id="activity-title">Actividad reciente</h2></div><Activity size={19}/></header>
        {!data && <p className="empty-state">Consultando actividad…</p>}
        {data && !activity.length && <div className="empty-state"><strong>Sin actividad disponible</strong>La fuente de auditoría no devolvió operaciones recientes.</div>}
        {activity.slice(0, 6).map(row => <article key={row.id} className="activity-row"><span className="activity-icon"><ScrollText size={15}/></span><div><strong>{row.accion || 'Operación administrativa'}</strong><p>{row.detalle || `${row.entidad || 'Entidad'} #${row.registro ?? '—'}`}</p><small>{row.actor || 'Sistema'} · {formatDate(row.fecha)}</small></div></article>)}
        {activity.length > 0 && <footer className="panel-footer"><Link to="/admin/auditoria">Consultar toda la auditoría <ArrowRight size={14}/></Link></footer>}
      </section>
    </div>

  </main>;
}
