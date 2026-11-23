import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, Download, Link2, Plus, RefreshCw, Search, ShieldAlert, Unlink } from 'lucide-react';
import IncidentCreateForm from '../../components/support/IncidentCreateForm';
import IncidentIndicators from '../../components/support/IncidentIndicators';
import { listChangeRequests } from '../../services/changeManagementService';
import {
  assignProductionIncident, classifyProductionIncident, createProductionIncident,
  exportProductionIncidentReport, getProductionIncident, getProductionIncidentConfiguration,
  getProductionIncidentIndicators, linkProductionIncidentChange,
  linkProductionIncidentTicket, listProductionIncidents, resolveProductionIncidentEscalation,
  saveProductionIncidentWorkbook,
  transitionProductionIncident, unlinkProductionIncidentChange, unlinkProductionIncidentTicket,
} from '../../services/incidentService';
import { listSupportTickets, listTechnicians } from '../../services/supportService';
import {
  displayStatusOf, formatIncidentDate, incidentDisplayStatusLabels, incidentDisplayStatusTone,
  incidentStatusLabels, priorityTone,
} from '../../utils/incidentUi';

const field = 'technical-field mt-1 w-full px-3 py-2.5 text-sm';
const adminTransitions = {
  SERVICIO_RECUPERADO: [['VERIFICADO','Verificar servicio'],['EN_INVESTIGACION','Devolver a investigación']],
  VERIFICADO: [['CERRADO','Cerrar incidente']], CERRADO: [['EN_INVESTIGACION','Reabrir incidente']],
};
const emptyClassification = { priority: 'P3', reason: '', categoryCode: '', categoryReason: '' };

export default function AdminIncidentPanel() {
  const [rows,setRows]=useState([]), [detail,setDetail]=useState(null), [staff,setStaff]=useState([]);
  const [tickets,setTickets]=useState([]), [changes,setChanges]=useState([]), [configuration,setConfiguration]=useState({categories:[],problemTypes:[],slaPolicies:[]});
  const [selectedId,setSelectedId]=useState(null), [loading,setLoading]=useState(true), [busy,setBusy]=useState(false);
  const [indicators,setIndicators]=useState(null), [indicatorsLoading,setIndicatorsLoading]=useState(true), [exporting,setExporting]=useState(false);
  const [error,setError]=useState(''), [notice,setNotice]=useState(''), [showCreate,setShowCreate]=useState(false);
  const [query,setQuery]=useState(''), [statusFilter,setStatusFilter]=useState('all'), [priorityFilter,setPriorityFilter]=useState('all'), [categoryFilter,setCategoryFilter]=useState('all');
  const [responsibleFilter,setResponsibleFilter]=useState('all'), [fromDate,setFromDate]=useState(''), [toDate,setToDate]=useState('');
  const [classification,setClassification]=useState(emptyClassification), [transitionDetail,setTransitionDetail]=useState(''), [escalationResolution,setEscalationResolution]=useState('');
  const [ticketLink,setTicketLink]=useState({id:'',relationship:'RELACIONADO'}), [changeLink,setChangeLink]=useState({id:'',purpose:'CORRECCION'});
  const selected=detail?.incident || rows.find(row=>row.id===selectedId) || null;
  const activeEscalation=detail?.escalations?.find(item=>!item.resolvedAt) || null;
  const reportFilters=useMemo(()=>({
    query:query.trim()||undefined,
    status:statusFilter==='all'?undefined:statusFilter,
    priority:priorityFilter==='all'?undefined:priorityFilter,
    categoryCode:categoryFilter==='all'?undefined:categoryFilter,
    responsibleId:responsibleFilter==='all'?undefined:responsibleFilter,
    fromDate:fromDate||undefined,
    toDate:toDate||undefined,
  }),[query,statusFilter,priorityFilter,categoryFilter,responsibleFilter,fromDate,toDate]);

  const visible=useMemo(()=>{
    const term=query.trim().toLowerCase();
    return rows.filter(row=>(!term||[row.code,row.title,row.component,row.reporterEmail,row.categoryCode].some(value=>String(value||'').toLowerCase().includes(term)))
      &&(statusFilter==='all'||displayStatusOf(row)===statusFilter)
      &&(priorityFilter==='all'||(row.priority||row.suggestedPriority)===priorityFilter)
      &&(categoryFilter==='all'||(row.categoryCode||row.suggestedCategory)===categoryFilter)
      &&(responsibleFilter==='all'||String(row.responsibleId||'unassigned')===responsibleFilter)
      &&(!fromDate||row.detectedAt&&row.detectedAt.slice(0,10)>=fromDate)
      &&(!toDate||row.detectedAt&&row.detectedAt.slice(0,10)<=toDate));
  },[query,rows,statusFilter,priorityFilter,categoryFilter,responsibleFilter,fromDate,toDate]);

  const load=async signal=>{
    setLoading(true);
    try{
      const [incidents,config,technicians,ticketRows,changeRows]=await Promise.all([
        listProductionIncidents(signal),getProductionIncidentConfiguration(signal),listTechnicians(signal),
        listSupportTickets(signal),listChangeRequests(signal),
      ]);
      const safe=Array.isArray(incidents)?incidents:[];
      setRows(safe);setConfiguration(config||{categories:[],problemTypes:[],slaPolicies:[]});
      setStaff(Array.isArray(technicians)?technicians:[]);setTickets(Array.isArray(ticketRows)?ticketRows:[]);setChanges(Array.isArray(changeRows)?changeRows:[]);
      setSelectedId(current=>current&&safe.some(row=>row.id===current)?current:(safe[0]?.id||null));setError('');
    }catch(failure){if(failure.name!=='AbortError')setError(failure.message);}finally{setLoading(false);}
  };
  useEffect(()=>{const controller=new AbortController();load(controller.signal);return()=>controller.abort();},[]);
  useEffect(()=>{
    const controller=new AbortController();
    const timer=setTimeout(()=>{setIndicatorsLoading(true);getProductionIncidentIndicators(reportFilters,controller.signal)
      .then(setIndicators).catch(failure=>{if(failure.name!=='AbortError')setError(failure.message);})
      .finally(()=>{if(!controller.signal.aborted)setIndicatorsLoading(false);});},200);
    return()=>{clearTimeout(timer);controller.abort();};
  },[reportFilters,rows]);
  useEffect(()=>{
    if(!selectedId){setDetail(null);return undefined;}
    const controller=new AbortController();
    getProductionIncident(selectedId,controller.signal).then(data=>{
      setDetail(data);
      setClassification({priority:data.incident.priority||data.incident.suggestedPriority||'P3',reason:'',categoryCode:data.incident.categoryCode||data.incident.suggestedCategory||'',categoryReason:''});
      setTransitionDetail('');setEscalationResolution('');
    }).catch(failure=>{if(failure.name!=='AbortError')setError(failure.message);});
    return()=>controller.abort();
  },[selectedId]);

  const accept=updated=>{setDetail(updated);setRows(values=>values.map(value=>value.id===updated.incident.id?updated.incident:value));};
  const run=async(callback,message)=>{if(busy)return false;setBusy(true);setError('');setNotice('');try{const updated=await callback();if(updated?.incident)accept(updated);setNotice(message);return true;}catch(failure){setError(failure.message);return false;}finally{setBusy(false);}};
  const create=async data=>{let created;const ok=await run(async()=>{created=await createProductionIncident(data);return created;},'Incidente registrado para clasificación.');if(ok){setRows(values=>[created.incident,...values]);setSelectedId(created.incident.id);setShowCreate(false);}return ok;};
  const categoryNeedsReason=Boolean(selected&&classification.categoryCode!==selected.suggestedCategory);
  const priorityNeedsReason=Boolean(selected&&classification.priority!==selected.suggestedPriority);
  const classify=()=>run(()=>classifyProductionIncident(selected.id,{...classification,expectedVersion:selected.version}),'Clasificación registrada; se aplicaron SLA y asignación automática cuando existió una regla elegible.');
  const assign=technicianId=>run(()=>assignProductionIncident(selected.id,{technicianId:Number(technicianId),expectedVersion:selected.version}),'Responsable asignado.');
  const transition=status=>{if(!transitionDetail.trim()){setError('Registra el detalle que sustenta el cambio de estado.');return;}run(()=>transitionProductionIncident(selected.id,{status,detail:transitionDetail.trim(),expectedVersion:selected.version}),'Estado actualizado con trazabilidad.');};
  const resolveEscalation=async()=>{if(!escalationResolution.trim())return;const ok=await run(()=>resolveProductionIncidentEscalation(selected.id,activeEscalation.id,{resolution:escalationResolution.trim(),expectedVersion:selected.version}),'Escalamiento resuelto.');if(ok)setEscalationResolution('');};
  const linkTicket=()=>ticketLink.id&&run(()=>linkProductionIncidentTicket(selected.id,Number(ticketLink.id),ticketLink.relationship),'Ticket relacionado.');
  const linkChange=()=>changeLink.id&&run(()=>linkProductionIncidentChange(selected.id,Number(changeLink.id),changeLink.purpose),'RFC relacionada.');
  const exportReport=async()=>{if(exporting)return;setExporting(true);setError('');try{const blob=await exportProductionIncidentReport(reportFilters);saveProductionIncidentWorkbook(blob);setNotice('Reporte XLSX generado con los filtros activos.');}catch(failure){setError(failure.message);}finally{setExporting(false);}};

  const displayStatus=displayStatusOf(selected);
  return <section className="admin-incident-panel space-y-4">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Operación y continuidad</p><h2 className="text-2xl font-bold text-app-primary">Control de Incidentes</h2><p className="subtitle">Clasifica P1–P4, aplica SLA, asigna responsables y conserva relaciones auditables.</p></div><div className="flex flex-wrap gap-2"><button type="button" className="btn" disabled={exporting} onClick={exportReport}><Download size={15}/>{exporting?'Generando…':'Exportar XLSX'}</button><button type="button" className="btn" onClick={()=>load()}><RefreshCw size={15}/>Actualizar</button><button type="button" className="btn btn-primary" onClick={()=>setShowCreate(value=>!value)}><Plus size={15}/>{showCreate?'Cerrar formulario':'Nuevo incidente'}</button></div></header>
    {error&&<div role="alert" className="alert"><span><AlertTriangle size={16}/>{error}</span></div>}{notice&&<div role="status" className="alert success"><span><CheckCircle2 size={16}/>{notice}</span></div>}
    {showCreate&&<section className="surface p-5"><h3 className="mb-4 text-lg font-bold text-app-primary">Registro manual administrativo</h3><IncidentCreateForm onSubmit={create} busy={busy} allowOverride categories={configuration.categories} problemTypes={configuration.problemTypes} incidentOptions={rows}/></section>}
    <IncidentIndicators data={indicators} categories={configuration.categories} loading={indicatorsLoading}/>
    <section className="surface grid gap-3 p-3 sm:grid-cols-3" aria-label="Filtros administrativos adicionales">
      <label className="text-xs font-semibold text-app-secondary">Responsable<select className="toolbar-select mt-1 w-full" value={responsibleFilter} onChange={event=>setResponsibleFilter(event.target.value)}><option value="all">Todos</option><option value="unassigned">Sin asignar</option>{staff.map(person=><option key={person.id} value={person.id}>{person.email}</option>)}</select></label>
      <label className="text-xs font-semibold text-app-secondary">Desde<input type="date" className="toolbar-select mt-1 w-full" value={fromDate} max={toDate||undefined} onChange={event=>setFromDate(event.target.value)}/></label>
      <label className="text-xs font-semibold text-app-secondary">Hasta<input type="date" className="toolbar-select mt-1 w-full" value={toDate} min={fromDate||undefined} onChange={event=>setToDate(event.target.value)}/></label>
    </section>
    <IncidentRegister rows={visible} loading={loading} selectedId={selectedId} onSelect={setSelectedId} categories={configuration.categories} query={query} setQuery={setQuery} statusFilter={statusFilter} setStatusFilter={setStatusFilter} priorityFilter={priorityFilter} setPriorityFilter={setPriorityFilter} categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter}/>
    <div className="incident-detail-layout">
      <section className="surface min-w-0 overflow-hidden" aria-label="Expediente del incidente">{!selected?<div className="empty-state"><strong>Selecciona un incidente</strong>Aquí aparecerá su expediente.</div>:<><header className="panel-heading"><div><p className="eyebrow">{selected.code}</p><h2>{selected.title}</h2><p className="subtitle">{selected.component} · Reportado por {selected.reporterEmail}</p></div><div className="flex flex-wrap gap-2"><span className={`rounded-full px-3 py-1 text-xs font-bold ${priorityTone[selected.priority||selected.suggestedPriority]||'bg-app-muted text-app-body'}`}>{selected.priority||`Sugerida ${selected.suggestedPriority}`}</span><span className={`rounded-full px-3 py-1 text-xs font-bold ${incidentDisplayStatusTone[displayStatus]}`}>{incidentDisplayStatusLabels[displayStatus]||displayStatus}</span></div></header>
        <div className="space-y-4 p-4 sm:p-5"><dl className="support-summary"><Info label="Estado interno" value={incidentStatusLabels[selected.status]}/><Info label="Problema" value={problemName(configuration.problemTypes,selected.type)}/><Info label="Categoría" value={categoryName(configuration.categories,selected.categoryCode||selected.suggestedCategory)}/><Info label="Reportado por" value={selected.reporterEmail||'Sin información'}/><Info label="Canal" value={sourceLabel(selected.source)}/><Info label="Responsable" value={selected.responsibleEmail||'Sin asignar'}/><Info label="Asignación" value={selected.assignmentSource}/><Info label="Detectado" value={formatIncidentDate(selected.detectedAt)}/><Info label="Inicio declarado" value={formatIncidentDate(selected.startedAt)}/><Info label="Registrado" value={formatIncidentDate(selected.createdAt)}/><Info label="Primera atención" value={formatIncidentDate(selected.firstAttentionAt)}/><Info label="Versión" value={String(selected.version)}/></dl>
        <section className="support-section"><h3>Impacto y diagnóstico inicial</h3><p className="whitespace-pre-wrap">{selected.description}</p><p className="muted">Alcance: {selected.scope} · Impacto: {selected.impact} · Urgencia: {selected.urgency}</p><p className="muted">Proceso esencial: {selected.essentialProcess?'Sí':'No'} · Servicio bloqueado: {selected.serviceBlocked?'Sí':'No'} · Alternativa: {selected.workaroundAvailable?'Sí':'No'}</p>{selected.repeatedFailure&&<p className="muted">Falla repetida · Incidente anterior: {selected.previousIncidentId||'Sin referencia'}</p>}</section>
        <SlaSection incident={selected}/>
        {selected.status==='REGISTRADO'&&<section className="support-section"><h3>Clasificación administrativa</h3><p className="muted">Sugerencias del servidor: {selected.suggestedCategory||'categoría pendiente'} · {selected.suggestedPriority}</p><div className="grid gap-3 md:grid-cols-2"><label className="support-field">Prioridad final<select className={field} value={classification.priority} onChange={event=>setClassification({...classification,priority:event.target.value})}>{['P1','P2','P3','P4'].map(value=><option key={value}>{value}</option>)}</select></label><label className="support-field">Categoría final<select className={field} value={classification.categoryCode} onChange={event=>setClassification({...classification,categoryCode:event.target.value})}><option value="">Seleccionar</option>{configuration.categories.map(item=><option key={item.code} value={item.code}>{item.name}</option>)}</select></label><label className="support-field">Motivo de prioridad {priorityNeedsReason&&'*'}<textarea required={priorityNeedsReason} className={field} rows={2} maxLength={800} value={classification.reason} onChange={event=>setClassification({...classification,reason:event.target.value})}/></label><label className="support-field">Motivo de categoría {categoryNeedsReason&&'*'}<textarea required={categoryNeedsReason} className={field} rows={2} maxLength={800} value={classification.categoryReason} onChange={event=>setClassification({...classification,categoryReason:event.target.value})}/></label></div><div className="editor-actions"><button className="btn btn-primary" disabled={busy||!classification.categoryCode||(priorityNeedsReason&&!classification.reason.trim())||(categoryNeedsReason&&!classification.categoryReason.trim())} onClick={classify}>Confirmar clasificación</button></div></section>}
        {selected.status==='CLASIFICADO'&&<section className="support-section"><p className="muted">No se encontró una regla automática elegible. Asigna manualmente.</p><label className="support-field">Asignar técnico<select className={field} defaultValue="" disabled={busy} onChange={event=>event.target.value&&assign(event.target.value)}><option value="">Selecciona un responsable</option>{staff.map(person=><option key={person.id} value={person.id}>{person.email}</option>)}</select></label></section>}
        <section className="support-section"><h3>Resolución técnica</h3><p><strong>Solución aplicada:</strong> {selected.appliedSolution||'Pendiente'}</p><p><strong>Causa raíz:</strong> {selected.rootCause||'Pendiente'}</p><p><strong>Aprendizaje:</strong> {selected.learning||'Pendiente'}</p></section>
        {activeEscalation&&<section className="support-section border-red-300 dark:border-red-900"><h3 className="flex items-center gap-2"><ShieldAlert size={16}/>Escalamiento activo</h3><p>{activeEscalation.reason}</p><p className="muted">Creado: {formatIncidentDate(activeEscalation.createdAt)} · Destino: {activeEscalation.destinationUserId||'Administración'}</p><label className="support-field">Resolución del escalamiento<textarea className={field} rows={2} maxLength={1000} value={escalationResolution} onChange={event=>setEscalationResolution(event.target.value)}/></label><div className="editor-actions"><button className="btn btn-primary" disabled={busy||!escalationResolution.trim()} onClick={resolveEscalation}>Resolver escalamiento</button></div></section>}
        {(adminTransitions[selected.status]||[]).length>0&&<section className="support-section"><h3>Control administrativo</h3><label className="support-field">Detalle obligatorio<textarea className={field} rows={3} maxLength={1000} value={transitionDetail} onChange={event=>setTransitionDetail(event.target.value)}/></label><div className="editor-actions">{adminTransitions[selected.status].map(([value,label])=><button key={value} className={value==='VERIFICADO'||value==='CERRADO'?'btn btn-primary':'btn'} disabled={busy||!transitionDetail.trim()||(value==='VERIFICADO'&&(!selected.appliedSolution||selected.activeEscalation))} onClick={()=>transition(value)}>{label}</button>)}</div></section>}
        <section className="support-section"><h3 className="flex items-center gap-2"><Link2 size={16}/>Relaciones sin propagación de estado</h3><div className="grid gap-4 lg:grid-cols-2"><RelationForm label="Ticket" options={tickets.filter(row=>!detail?.ticketIds?.includes(row.id))} value={ticketLink.id} onValue={id=>setTicketLink({...ticketLink,id})} mode={ticketLink.relationship} onMode={relationship=>setTicketLink({...ticketLink,relationship})} modes={['ORIGEN','AFECTADO','RELACIONADO']} onLink={linkTicket}/><RelationForm label="RFC" options={changes.filter(row=>!detail?.changeRequestIds?.includes(row.id))} value={changeLink.id} onValue={id=>setChangeLink({...changeLink,id})} mode={changeLink.purpose} onMode={purpose=>setChangeLink({...changeLink,purpose})} modes={['MITIGACION','CORRECCION','PREVENCION']} onLink={linkChange}/></div><div className="mt-4 grid gap-3 lg:grid-cols-2"><Relations title="Tickets vinculados" ids={detail?.ticketIds} rows={tickets} onRemove={id=>run(()=>unlinkProductionIncidentTicket(selected.id,id),'Ticket desvinculado.')} busy={busy}/><Relations title="RFC vinculadas" ids={detail?.changeRequestIds} rows={changes} onRemove={id=>run(()=>unlinkProductionIncidentChange(selected.id,id),'RFC desvinculada.')} busy={busy}/></div></section>
        <Audit detail={detail}/></div></>}</section>
    </div>
  </section>;
}

function categoryName(categories,code){return categories.find(item=>item.code===code)?.name||code||'Pendiente';}
function problemName(problemTypes,code){const problem=problemTypes.find(item=>item.code===code);return problem?`${problem.code} · ${problem.name}`:code||'Sin clasificación';}
function sourceLabel(source){return source==='MONITOREO'?'Monitoreo técnico':'Comunicación o detección manual';}
function Info({label,value}){return <div><dt>{label}</dt><dd>{value||'Sin información'}</dd></div>;}
function incidentDate(value){if(!value)return null;const normalized=typeof value==='string'&&!/(?:Z|[+-]\d{2}:\d{2})$/.test(value)?`${value}-05:00`:value;const date=new Date(normalized);return Number.isNaN(date.getTime())?null:date;}
function hoursBetween(start,end){const from=incidentDate(start),to=incidentDate(end);return from&&to?`${Math.max(0,(to-from)/3600000).toFixed(2)} h`:'Pendiente';}
function repeatedLabel(value){return value===true?'Sí':value===false?'No':'Pendiente';}
function textOrPending(value){return String(value||'').trim()||'Pendiente';}
function IncidentRegister({rows,loading,selectedId,onSelect,categories,query,setQuery,statusFilter,setStatusFilter,priorityFilter,setPriorityFilter,categoryFilter,setCategoryFilter}){
  const select=row=>onSelect(row.id);
  return <section className="surface incident-register" aria-labelledby="incident-register-title">
    <header className="panel-heading"><div><p className="eyebrow">Trazabilidad administrativa</p><h3 id="incident-register-title">Registro</h3><p className="subtitle">Incidentes técnicos registrados y documentados para seguimiento y control administrativo.</p></div><span className="count-label">{rows.length} registros visibles</span></header>
    <div className="toolbar"><div className="search-field"><Search aria-hidden="true"/><input value={query} onChange={event=>setQuery(event.target.value)} aria-label="Buscar incidentes" placeholder="Código, descripción, responsable o categoría…"/></div><select className="toolbar-select" aria-label="Filtrar estado visible" value={statusFilter} onChange={event=>setStatusFilter(event.target.value)}><option value="all">Todos los estados</option>{Object.entries(incidentDisplayStatusLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><select className="toolbar-select" aria-label="Filtrar prioridad" value={priorityFilter} onChange={event=>setPriorityFilter(event.target.value)}><option value="all">Todas las prioridades</option>{['P1','P2','P3','P4'].map(value=><option key={value}>{value}</option>)}</select><select className="toolbar-select" aria-label="Filtrar categoría" value={categoryFilter} onChange={event=>setCategoryFilter(event.target.value)}><option value="all">Todas las categorías</option>{categories.map(item=><option key={item.code} value={item.code}>{item.name}</option>)}</select></div>
    <div className="table-scroll" tabIndex="0" aria-label="Tabla desplazable del registro de incidentes"><table><thead><tr>{['Código','Detección','Reportado por','Descripción','Categoría','Prioridad','Responsable','Estado','Primera atención','Cierre','Solución aplicada','Causa y aprendizaje','Falla repetida','Horas hasta atención','Horas hasta solución','Tiempo límite','Vencido'].map(label=><th key={label}>{label}</th>)}</tr></thead><tbody>{rows.map(row=>{const state=displayStatusOf(row);const sla=incidentSlaSummary(row);const priority=row.priority||row.suggestedPriority;return <tr key={row.id} tabIndex="0" aria-selected={row.id===selectedId} onClick={()=>select(row)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();select(row);}}}><td><strong>{row.code||'No registrado'}</strong></td><td>{row.detectedAt?formatIncidentDate(row.detectedAt):'No registrado'}</td><td>{textOrPending(row.reporterEmail)}</td><td className="incident-register-description">{textOrPending(row.description)}</td><td>{categoryName(categories,row.categoryCode||row.suggestedCategory)}</td><td><span className={`incident-register-badge ${priorityTone[priority]||'bg-app-muted text-app-body'}`}>{row.priority?priority:priority?`Sugerida ${priority}`:'Pendiente'}</span></td><td>{row.responsibleEmail||'Sin asignar'}</td><td><span className={`incident-register-badge ${incidentDisplayStatusTone[state]||'bg-app-muted text-app-body'}`}>{incidentDisplayStatusLabels[state]||state||'Pendiente'}</span></td><td>{row.firstAttentionAt?formatIncidentDate(row.firstAttentionAt):'Pendiente'}</td><td>{row.closedAt?formatIncidentDate(row.closedAt):'Pendiente'}</td><td className="incident-register-description">{textOrPending(row.appliedSolution)}</td><td className="incident-register-description">{[row.rootCause,row.learning].filter(Boolean).join(' · ')||'Pendiente'}</td><td>{repeatedLabel(row.repeatedFailure)}</td><td>{hoursBetween(row.detectedAt,row.firstAttentionAt)}</td><td>{hoursBetween(row.detectedAt,row.recoveredAt)}</td><td>{hoursBetween(row.detectedAt,row.slaResolutionAt)}</td><td><span className={`incident-register-sla ${sla.label==='Vencido'?'danger':sla.label==='Cumplido'?'success':'warning'}`}>{sla.label}</span></td></tr>;})}</tbody></table></div>
    {loading&&<p role="status" className="empty-state">Cargando incidentes…</p>}{!loading&&!rows.length&&<div className="empty-state"><strong>Sin resultados</strong>No existen incidentes con los filtros seleccionados.</div>}
  </section>;
}
function slaState(actual,deadline){const limit=incidentDate(deadline);if(!limit)return {label:'Pendiente de clasificación',tone:'text-app-secondary'};const observed=incidentDate(actual);if(observed)return observed<=limit?{label:'Cumplido',tone:'text-emerald-700 dark:text-emerald-300'}:{label:'Vencido',tone:'text-red-700 dark:text-red-300'};return new Date()<=limit?{label:'En curso',tone:'text-amber-700 dark:text-amber-300'}:{label:'Vencido',tone:'text-red-700 dark:text-red-300'};}
function incidentSlaSummary(incident){const attention=slaState(incident.firstAttentionAt,incident.slaFirstAttentionAt);const resolution=slaState(incident.recoveredAt||incident.closedAt,incident.slaResolutionAt);if(attention.label==='Vencido'||resolution.label==='Vencido')return {label:'Vencido',tone:'text-red-700 dark:text-red-300'};if(attention.label==='Cumplido'&&resolution.label==='Cumplido')return {label:'Cumplido',tone:'text-emerald-700 dark:text-emerald-300'};if(attention.label==='Pendiente de clasificación')return attention;return {label:'En curso',tone:'text-amber-700 dark:text-amber-300'};}
function elapsedLabel(start,end){const from=incidentDate(start),to=incidentDate(end);if(!from||!to)return 'Pendiente';const minutes=Math.max(0,Math.round((to-from)/60000));return minutes<60?`${minutes} min`:`${(minutes/60).toFixed(2)} h`;}
function SlaSection({incident}){const attention=slaState(incident.firstAttentionAt,incident.slaFirstAttentionAt);const resolution=slaState(incident.recoveredAt||incident.closedAt,incident.slaResolutionAt);return <section className="support-section"><h3 className="flex items-center gap-2"><Clock3 size={16}/>SLA y fechas</h3><dl className="mt-3 grid gap-3 sm:grid-cols-2"><Info label="Límite primera atención" value={formatIncidentDate(incident.slaFirstAttentionAt)}/><Info label="Límite resolución" value={formatIncidentDate(incident.slaResolutionAt)}/><Info label="Recuperado" value={formatIncidentDate(incident.recoveredAt)}/><Info label="Verificado" value={formatIncidentDate(incident.verifiedAt)}/><Info label="Cerrado" value={formatIncidentDate(incident.closedAt)}/><Info label="Tiempo hasta atención" value={elapsedLabel(incident.detectedAt,incident.firstAttentionAt)}/><Info label="Tiempo hasta recuperación" value={elapsedLabel(incident.detectedAt,incident.recoveredAt)}/></dl><div className="mt-4 grid gap-2 sm:grid-cols-2"><p className={`rounded-lg bg-app-muted p-3 text-sm font-bold ${attention.tone}`}>Primera atención: {attention.label}</p><p className={`rounded-lg bg-app-muted p-3 text-sm font-bold ${resolution.tone}`}>Resolución: {resolution.label}</p></div></section>;}
function RelationForm({label,options,value,onValue,mode,onMode,modes,onLink}){return <div><label className="support-field">{label}<select className={field} value={value} onChange={event=>onValue(event.target.value)}><option value="">Seleccionar</option>{options.map(row=><option key={row.id} value={row.id}>{row.code} · {row.title}</option>)}</select></label><div className="mt-2 flex gap-2"><select className={`${field} mt-0`} value={mode} onChange={event=>onMode(event.target.value)}>{modes.map(item=><option key={item}>{item}</option>)}</select><button type="button" className="btn" disabled={!value} onClick={onLink}>Vincular</button></div></div>;}
function Relations({title,ids=[],rows,onRemove,busy}){return <div className="rounded-xl border border-app-border bg-app-muted p-3"><strong className="text-sm text-app-primary">{title}</strong>{ids.length?<ul className="mt-2 space-y-2">{ids.map(id=>{const row=rows.find(item=>item.id===id);return <li key={id} className="flex items-center justify-between gap-2 text-xs text-app-body"><span>{row?`${row.code} · ${row.title}`:`ID ${id}`}</span><button type="button" aria-label={`Desvincular ${id}`} disabled={busy} onClick={()=>onRemove(id)}><Unlink size={14}/></button></li>;})}</ul>:<p className="mt-2 text-xs text-app-secondary">Sin relaciones.</p>}</div>;}
function Audit({detail}){return <details className="support-section"><summary>Seguimiento, actividad e historial</summary><div className="mt-3 grid gap-4 xl:grid-cols-3"><Timeline title="Actividades" rows={detail?.activities} render={item=><><strong>{item.type}</strong> · {item.actorEmail}<p className="mt-1 whitespace-pre-wrap">{item.detail}</p><small>{formatIncidentDate(item.createdAt)}</small></>}/><Timeline title="Transiciones" rows={detail?.history} render={item=><><strong>{item.previousStatus||'Inicio'} → {item.newStatus}</strong><p className="mt-1">{item.detail}</p><small>{item.actorEmail} · {formatIncidentDate(item.createdAt)}</small></>}/><Timeline title="Escalamientos" rows={detail?.escalations} render={item=><><strong>{item.resolvedAt?'Resuelto':'Activo'}</strong><p className="mt-1">{item.reason}</p>{item.resolution&&<p>Resolución: {item.resolution}</p>}<small>{formatIncidentDate(item.createdAt)}</small></>}/></div></details>;}
function Timeline({title,rows=[],render}){return <div><h4 className="text-sm font-bold text-app-primary">{title}</h4>{rows.length?<ul className="mt-2 space-y-2">{rows.map(item=><li key={item.id} className="rounded-lg bg-app-muted p-3 text-xs text-app-body">{render(item)}</li>)}</ul>:<p className="text-xs text-app-secondary">Sin registros.</p>}</div>;}
