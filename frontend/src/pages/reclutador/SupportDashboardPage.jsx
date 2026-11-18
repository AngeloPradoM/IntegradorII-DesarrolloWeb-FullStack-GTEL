import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, Gauge, RefreshCw, Search } from 'lucide-react';
import { getAdminSupportSlaDashboard } from '../../services/supportService';
import '../admin/admin-workspace.css';

const slaTone = {
  CUMPLIDO: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-200 dark:border-blue-900',
  'A TIEMPO': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-900',
  'POR VENCER': 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-900',
  VENCIDO: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-200 dark:border-red-900',
};
const formatDate = value => {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Lima' }).format(date) : 'Sin fecha';
};

export default function SupportDashboardPage() {
  const [tickets, setTickets] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getAdminSupportSlaDashboard(controller.signal).then(rows => { setTickets(Array.isArray(rows) ? rows : []); setError(''); }).catch(failure => { if (failure.name !== 'AbortError') { setTickets([]); setError(failure.message); } });
    return () => controller.abort();
  }, [revision]);

  const visible = useMemo(() => (tickets || []).filter(ticket => {
    const term = query.trim().toLowerCase();
    return (!term || [ticket.code, ticket.title, ticket.assignedTo, ticket.priority].some(value => String(value || '').toLowerCase().includes(term))) && (statusFilter === 'all' || ticket.slaStatus === statusFilter);
  }), [query, statusFilter, tickets]);
  const metrics = useMemo(() => {
    const rows = tickets || [];
    const compliant = rows.filter(row => ['CUMPLIDO', 'A TIEMPO'].includes(row.slaStatus)).length;
    return { total: rows.length, compliant, risk: rows.filter(row => row.slaStatus === 'POR VENCER').length, overdue: rows.filter(row => row.slaStatus === 'VENCIDO').length, percentage: rows.length ? Math.round((compliant / rows.length) * 100) : null };
  }, [tickets]);

  const cards = [[Gauge, 'Total de solicitudes', metrics.total, 'Registros evaluados'], [CheckCircle2, 'Dentro del SLA', metrics.compliant, metrics.percentage === null ? 'Sin datos para calcular' : `${metrics.percentage}% de cumplimiento`], [Clock3, 'En riesgo', metrics.risk, 'Próximas a vencer'], [AlertCircle, 'Vencidas', metrics.overdue, 'Requieren atención']];

  return <main className="admin-workspace admin-workspace-wide">
    <div className="page-heading"><div><p className="eyebrow">Monitor ejecutivo</p><h1>Tablero SLA</h1><p className="subtitle">Supervisa el cumplimiento de los acuerdos de nivel de servicio sin modificar sus reglas ni fechas.</p></div><button className="btn" type="button" onClick={() => { setTickets(null); setRevision(value => value + 1); }}><RefreshCw size={15}/>Actualizar</button></div>
    <section className="metric-grid" aria-label="Indicadores SLA">{cards.map(([Icon,label,value,description], index)=><article key={label} className="metric-card"><span className={`metric-icon ${index===1?'success':index===2?'violet':index===3?'':'blue'}`}><Icon/></span><div><span className="metric-label">{label}</span><strong className="metric-value">{tickets ? value : '—'}</strong><small>{description}</small></div></article>)}</section>
    {error&&<div role="alert" className="alert"><span><AlertCircle size={16}/>{error}</span><button className="btn" onClick={()=>setRevision(value=>value+1)}>Reintentar</button></div>}
    <section className="surface border-app-border bg-app-surface" aria-label="Cumplimiento de solicitudes">
      <div className="toolbar"><div className="search-field"><Search aria-hidden="true"/><input type="search" value={query} onChange={event=>setQuery(event.target.value)} aria-label="Buscar solicitudes SLA" placeholder="Buscar código, solicitud o responsable…"/></div><label className="sr-only" htmlFor="sla-filter">Cumplimiento SLA</label><select id="sla-filter" className="toolbar-select" value={statusFilter} onChange={event=>setStatusFilter(event.target.value)}><option value="all">Todos los estados</option>{Object.keys(slaTone).map(value=><option key={value}>{value}</option>)}</select><span className="count-label">{tickets?`${visible.length} visibles de ${tickets.length}`:'Consultando…'}</span></div>
      <div className="table-scroll"><table className="min-w-[920px]"><thead><tr>{['Código / Solicitud','Prioridad','Responsable','Estado','Cumplimiento SLA','Fecha límite'].map(label=><th key={label}>{label}</th>)}</tr></thead><tbody>{visible.map(ticket=><tr key={ticket.id} className={ticket.slaStatus==='VENCIDO'?'bg-red-50/40 dark:bg-red-950/10':''}><td><strong className="block text-app-primary">{ticket.code}</strong><small className="text-app-secondary">{ticket.title}</small></td><td><span className="pill">{ticket.priority}</span></td><td>{ticket.assignedTo||'Sin asignar'}</td><td><span className="pill">{ticket.status}</span></td><td><span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold ${slaTone[ticket.slaStatus]||'border-app-border bg-app-muted text-app-body'}`}>{ticket.slaStatus==='VENCIDO'?<AlertCircle className="h-3.5 w-3.5"/>:ticket.slaStatus==='CUMPLIDO'?<CheckCircle2 className="h-3.5 w-3.5"/>:<Clock3 className="h-3.5 w-3.5"/>}{ticket.slaStatus||'Sin datos'}</span></td><td className="whitespace-nowrap">{formatDate(ticket.slaDeadline)}</td></tr>)}</tbody></table></div>
      {!tickets&&<p role="status" className="empty-state">Cargando solicitudes…</p>}
      {tickets&&!visible.length&&<div className="empty-state"><strong>Sin resultados</strong>No hay solicitudes que coincidan con los filtros actuales.</div>}
    </section>
  </main>;
}
