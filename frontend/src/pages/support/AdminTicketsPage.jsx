import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, FileCheck2, RefreshCw, Search, ShieldCheck, TicketCheck, Users } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { assignSupportTicket, decideSupportProposal, getAdminSupportSlaDashboard, listSupportTickets, listTechnicians } from '../../services/supportService';
import '../admin/admin-workspace.css';
import AdminChangePanel from './AdminChangePanel';

const labels = { NUEVO:'Nuevo', ASIGNADO:'Asignado', EN_ATENCION:'En atención', EN_ESPERA:'En espera', RESUELTO:'Resuelto', CERRADO:'Cerrado' };
const formatDate = value => { const date = new Date(value); return value && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat('es-PE',{dateStyle:'medium',timeStyle:'short',timeZone:'America/Lima'}).format(date) : 'Sin fecha'; };

export default function AdminTicketsPage() {
  const [searchParams,setSearchParams] = useSearchParams();
  const queue = searchParams.get('queue') === 'changes' ? 'changes' : 'tickets';
  const [tickets,setTickets] = useState([]), [technicians,setTechnicians] = useState([]), [sla,setSla] = useState([]);
  const [selectedId,setSelectedId] = useState(null), [loading,setLoading] = useState(true), [busyId,setBusyId] = useState(null), [error,setError] = useState(''), [notice,setNotice] = useState(''), [comments,setComments] = useState({});
  const [query,setQuery] = useState(''), [statusFilter,setStatusFilter] = useState('all');

  const load = async signal => { setLoading(true); try { const [rows,staff,slaRows] = await Promise.all([listSupportTickets(signal),listTechnicians(signal),getAdminSupportSlaDashboard(signal)]); const safeRows = Array.isArray(rows)?rows:[]; setTickets(safeRows); setTechnicians(Array.isArray(staff)?staff:[]); setSla(Array.isArray(slaRows)?slaRows:[]); setSelectedId(current=>current&&safeRows.some(row=>row.id===current)?current:(safeRows[0]?.id||null)); setError(''); } catch(failure) { if(failure.name!=='AbortError') setError(failure.message); } finally { setLoading(false); } };
  useEffect(()=>{const controller=new AbortController();load(controller.signal);return()=>controller.abort();},[]);
  const stats=useMemo(()=>({total:tickets.length,new:tickets.filter(t=>t.status==='NUEVO').length,progress:tickets.filter(t=>['ASIGNADO','EN_ATENCION','EN_ESPERA'].includes(t.status)).length,pending:tickets.filter(t=>t.proposalStatus==='PENDIENTE').length}),[tickets]);
  const slaById=useMemo(()=>new Map(sla.map(row=>[row.id,row])),[sla]);
  const visible=useMemo(()=>{const term=query.trim().toLowerCase();return tickets.filter(ticket=>(!term||[ticket.code,ticket.title,ticket.requesterEmail,ticket.area].some(value=>String(value||'').toLowerCase().includes(term)))&&(statusFilter==='all'||ticket.status===statusFilter));},[query,statusFilter,tickets]);
  const selected=useMemo(()=>tickets.find(ticket=>ticket.id===selectedId)||null,[selectedId,tickets]);
  const replace=updated=>setTickets(rows=>rows.map(row=>row.id===updated.id?updated:row));
  const run=async(id,callback,message)=>{if(busyId)return;setBusyId(id);setError('');setNotice('');try{replace(await callback());setNotice(message);}catch(failure){setError(failure.message);}finally{setBusyId(null);}};
  const assign=(ticket,id)=>{if(!id)return;run(ticket.id,()=>assignSupportTicket(ticket.id,Number(id)),`Responsable asignado a ${ticket.code}.`);};
  const decide=(ticket,approved)=>{const comment=(comments[ticket.id]||'').trim();if(!approved&&!comment){setError('Escribe una observación antes de solicitar ajustes.');return;}run(ticket.id,()=>decideSupportProposal(ticket.id,approved,comment),approved?'Ejecución autorizada. El técnico ya puede realizar la solución.':'La propuesta fue devuelta al técnico.');};
  const setQueue=value=>{const next=new URLSearchParams(searchParams);if(value==='changes')next.set('queue','changes');else next.delete('queue');setSearchParams(next,{replace:true});};
  const slaRow=selected?slaById.get(selected.id):null;

  return <main className="admin-workspace admin-workspace-wide">
    <div className="page-heading"><div><p className="eyebrow">Control administrativo</p><h1>Mesa de ayuda</h1><p className="subtitle text-app-secondary">Asigna responsables, revisa propuestas y autoriza operaciones sin confundir autorización con resolución.</p></div><button className="btn" onClick={()=>load()}><RefreshCw size={15}/>Actualizar</button></div>
    {error&&<div role="alert" className="alert"><span><AlertCircle size={16}/>{error}</span></div>}
    {notice&&<div role="status" className="alert success"><span><CheckCircle2 size={16}/>{notice}</span></div>}

    <div className="filter-tabs admin-queue-tabs" role="tablist" aria-label="Módulos de la mesa de ayuda"><button role="tab" aria-selected={queue==='tickets'} aria-pressed={queue==='tickets'} onClick={()=>setQueue('tickets')}><TicketCheck size={16}/>Tickets y solicitudes</button><button role="tab" aria-selected={queue==='changes'} aria-pressed={queue==='changes'} onClick={()=>setQueue('changes')}><FileCheck2 size={16}/>Cambios RFC</button></div>

    {queue==='changes'?<AdminChangePanel/>:<>
      <section className="metric-grid" aria-label="Resumen de tickets">{[[TicketCheck,'Total',stats.total],[AlertCircle,'Nuevos',stats.new],[Users,'En seguimiento',stats.progress],[ShieldCheck,'Por autorizar',stats.pending]].map(([Icon,label,value],index)=><article key={label} className="metric-card"><span className={`metric-icon ${index===2?'blue':index===3?'violet':''}`}><Icon/></span><div><span className="metric-label">{label}</span><strong className="metric-value">{value}</strong><small>Tickets actuales</small></div></article>)}</section>
      <div className="rounded-xl border border-app-info-border bg-app-info p-4 text-app-body"><div className="flex flex-wrap items-center justify-between gap-3"><div><strong className="text-sm text-app-primary">Flujo de autorización</strong><p className="mt-1 text-xs">Aprobar habilita la ejecución; no marca el ticket como resuelto.</p></div><div className="flex flex-wrap items-center gap-2 text-[11px] font-bold"><span>Solicitud</span><ArrowRight size={13}/><span>Propuesta</span><ArrowRight size={13}/><span>Autorización</span><ArrowRight size={13}/><span>Ejecución</span></div></div></div>

      <div className="admin-support-grid">
        <section className="surface border-app-border bg-app-surface" aria-label="Listado de tickets">
          <div className="toolbar"><div className="search-field"><Search aria-hidden="true"/><input value={query} onChange={event=>setQuery(event.target.value)} type="search" aria-label="Buscar tickets" placeholder="Código, solicitud o solicitante…"/></div><label className="sr-only" htmlFor="ticket-status">Estado</label><select id="ticket-status" className="toolbar-select" value={statusFilter} onChange={event=>setStatusFilter(event.target.value)}><option value="all">Todos los estados</option>{Object.entries(labels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><span className="count-label">{visible.length} resultados</span></div>
          <div className="support-ticket-list">{loading?<p className="empty-state">Cargando tickets…</p>:visible.map(ticket=><button type="button" key={ticket.id} aria-pressed={ticket.id===selectedId} onClick={()=>setSelectedId(ticket.id)}><span><strong>{ticket.code}</strong><small>{ticket.area} · {ticket.requesterEmail}</small></span><span className="ticket-list-title">{ticket.title}</span><span className="pill">{labels[ticket.status]||ticket.status}</span></button>)}{!loading&&!visible.length&&<div className="empty-state"><strong>Sin resultados</strong>No hay tickets que coincidan con los filtros.</div>}</div>
        </section>

        <section className="surface support-detail border-app-border bg-app-surface" aria-label="Detalle del ticket seleccionado">
          {!selected?<div className="empty-state"><strong>Selecciona un ticket</strong>Aquí aparecerá la información y las acciones disponibles.</div>:<>
            <header className="panel-heading"><div><p className="eyebrow">{selected.code}</p><h2>{selected.title}</h2><p className="subtitle">{selected.category} · {selected.subcategory}</p></div><span className="pill">{labels[selected.status]||selected.status}</span></header>
            <div className="support-detail-body">
              <dl className="support-summary"><div><dt>Solicitante</dt><dd>{selected.requesterEmail}</dd></div><div><dt>Área</dt><dd>{selected.area}</dd></div><div><dt>Prioridad</dt><dd>{selected.priority}</dd></div><div><dt>SLA</dt><dd>{slaRow?.slaStatus||'Sin datos'}</dd></div><div><dt>Fecha límite</dt><dd>{formatDate(slaRow?.slaDeadline)}</dd></div></dl>
              <label className="support-field">Responsable asignado<select disabled={busyId===selected.id||['RESUELTO','CERRADO'].includes(selected.status)} value={selected.technicianId||''} onChange={event=>assign(selected,event.target.value)}><option value="">Sin asignar</option>{technicians.map(tech=><option key={tech.id} value={tech.id}>{tech.email}</option>)}</select></label>
              <details className="support-section" open><summary>Información general</summary><p><strong>Solicitud:</strong> {selected.description}</p><p><strong>Justificación:</strong> {selected.priorityJustification}</p></details>
              {selected.diagnosis&&<details className="support-section" open><summary>Propuesta técnica</summary><p><strong>Diagnóstico:</strong> {selected.diagnosis}</p><p><strong>Solución propuesta:</strong> {selected.proposedSolution}</p></details>}
              {selected.proposalStatus==='PENDIENTE'?<section className="support-section"><h3>Autorización administrativa</h3><p className="muted">La aprobación habilita la ejecución técnica y no resuelve el ticket.</p><label className="support-field">Observación<textarea rows={3} value={comments[selected.id]||''} onChange={event=>setComments(previous=>({...previous,[selected.id]:event.target.value}))} placeholder="Obligatoria para solicitar ajustes"/></label><div className="editor-actions"><button className="btn" disabled={busyId===selected.id} onClick={()=>decide(selected,false)}>Solicitar ajustes</button><button className="btn btn-primary" disabled={busyId===selected.id||!selected.technicianId} onClick={()=>decide(selected,true)}>Aprobar ejecución</button></div>{!selected.technicianId&&<small className="text-amber-700 dark:text-amber-300">Asigna un técnico antes de aprobar.</small>}</section>:<section className="support-section"><h3>Estado de autorización</h3><p>{selected.proposalStatus==='APROBADA'?'Ejecución técnica autorizada.':selected.proposalStatus==='RECHAZADA'?'Esperando una propuesta corregida.':'Esperando propuesta técnica.'}</p>{selected.adminComment&&<p><strong>Observación:</strong> {selected.adminComment}</p>}{selected.executionEvidence&&<p><strong>Evidencia registrada:</strong> {selected.executionEvidence}</p>}</section>}
              <details className="support-section"><summary>Historial disponible</summary><p>Creado: {formatDate(selected.createdAt)}</p><p>Actualizado: {formatDate(selected.updatedAt)}</p><p>Resuelto: {formatDate(selected.resolvedAt)}</p><small className="muted">El historial detallado requiere un endpoint adicional del backend.</small></details>
            </div>
          </>}
        </section>
      </div>

      <details className="surface incident-matrix"><summary>Matriz de Evaluación de Incidencias — referencia administrativa</summary><div className="table-scroll"><table className="min-w-[560px] text-center"><thead><tr><th>Probabilidad \ Impacto</th><th>Bajo</th><th>Medio</th><th>Alto</th></tr></thead><tbody>{[['Alta','Medio','Alto','Alto'],['Media','Bajo','Medio','Alto'],['Baja','Bajo','Bajo','Medio']].map(row=><tr key={row[0]}>{row.map((value,index)=><td key={value+index}>{value}</td>)}</tr>)}</tbody></table></div></details>
    </>}
  </main>;
}
