import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, CalendarDays, Check, CheckCircle2, ChevronRight, ClipboardCheck, Clock3, Flag, Paperclip, RefreshCw, ShieldCheck, SlidersHorizontal, Ticket, Wrench } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import TechnicalStageProgress from '../../components/technical/TechnicalStageProgress';
import { formatTechnicalDate, getSupportWorkflow } from '../../utils/technicalWorkflow';
import {
  getTechnicianSupportSlaDashboard,
  listSupportTickets,
  registerSupportExecution,
  submitSupportProposal,
  updateSupportTicketStatus,
} from '../../services/supportService';
import TechnicianChangePanel from './TechnicianChangePanel';

const PAGE_SIZE = 6;
const states = ['NUEVO', 'ASIGNADO', 'EN_ATENCION', 'EN_ESPERA', 'RESUELTO', 'CERRADO'];
const labels = {
  NUEVO: 'Nuevo',
  ASIGNADO: 'Asignado',
  EN_ATENCION: 'En atención',
  EN_ESPERA: 'En espera',
  RESUELTO: 'Resuelto',
  CERRADO: 'Cerrado',
};
const statusTone = {
  NUEVO: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-200',
  ASIGNADO: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  EN_ATENCION: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200',
  EN_ESPERA: 'bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-200',
  RESUELTO: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200',
  CERRADO: 'bg-app-muted text-app-body',
};
const fieldClassName = 'technical-field mt-1 w-full p-3 text-sm';

export default function TechnicianTicketsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const queue = searchParams.get('queue') === 'changes' ? 'changes' : 'support';
  const search = searchParams.get('q') || '';
  const [rfcCount, setRfcCount] = useState(0);
  const [tickets, setTickets] = useState([]);
  const [sla, setSla] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [solution, setSolution] = useState('');
  const [evidence, setEvidence] = useState('');
  const [status, setStatus] = useState('NUEVO');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [mobileDetail, setMobileDetail] = useState(false);

  const selected = useMemo(() => tickets.find(ticket => ticket.id === selectedId) || null, [tickets, selectedId]);
  const slaById = useMemo(() => new Map(sla.map(row => [row.id, row])), [sla]);
  const filteredTickets = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tickets.filter(ticket => {
      const matchesSearch = !term || [ticket.code, ticket.title, ticket.area, ticket.requesterEmail]
        .some(value => String(value || '').toLowerCase().includes(term));
      return matchesSearch
        && (statusFilter === 'all' || ticket.status === statusFilter)
        && (priorityFilter === 'all' || ticket.priority === priorityFilter);
    });
  }, [priorityFilter, search, statusFilter, tickets]);
  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / PAGE_SIZE));
  const visibleTickets = filteredTickets.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const load = async signal => {
    setLoading(true);
    try {
      const [rows, slaRows] = await Promise.all([
        listSupportTickets(signal),
        getTechnicianSupportSlaDashboard(signal),
      ]);
      const safeRows = Array.isArray(rows) ? rows : [];
      setTickets(safeRows);
      setSla(Array.isArray(slaRows) ? slaRows : []);
      setSelectedId(current => current && safeRows.some(row => row.id === current) ? current : (safeRows[0]?.id || null));
      setError('');
    } catch (failure) {
      if (failure.name !== 'AbortError') setError(failure.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!selected) return;
    setDiagnosis(selected.diagnosis || '');
    setSolution(selected.proposedSolution || '');
    setEvidence(selected.executionEvidence || '');
    setStatus(selected.status);
  }, [selected]);

  useEffect(() => setPage(1), [search, statusFilter, priorityFilter]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const replace = updated => setTickets(rows => rows.map(row => row.id === updated.id ? updated : row));
  const action = async callback => {
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const updated = await callback();
      replace(updated);
      setNotice('Cambios guardados correctamente.');
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  };

  const assigned = selected?.technicianEmail?.toLowerCase() === user.email.toLowerCase();
  const approved = selected?.proposalStatus === 'APROBADA';
  const allowedStates = approved ? states : ['NUEVO', 'ASIGNADO', 'EN_ESPERA'];
  const proposalLocked = ['PENDIENTE', 'APROBADA'].includes(selected?.proposalStatus);
  const workflow = getSupportWorkflow(selected);

  const switchQueue = next => {
    const params = new URLSearchParams(searchParams);
    params.set('queue', next);
    setSearchParams(params, { replace: true });
    setMobileDetail(false);
  };
  const handleTabKeys = event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    switchQueue(queue === 'support' ? 'changes' : 'support');
  };
  const chooseTicket = id => {
    setSelectedId(id);
    setMobileDetail(true);
  };
  const clearSearch = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('q');
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="technical-page mx-auto max-w-[1660px] space-y-4 p-4 sm:p-6 lg:p-7">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-app-primary sm:text-3xl">Bandeja de tickets</h1>
          <p className="mt-1 text-sm text-app-body sm:text-base">Gestiona solicitudes, incidencias y cambios de manera eficiente.</p>
        </div>
        <button type="button" onClick={() => load()} disabled={loading} className="technical-button-secondary inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold sm:w-auto">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />Actualizar
        </button>
      </header>

      {error && <p role="alert" className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"><AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />{error}</p>}
      {notice && <p role="status" className="flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"><CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />{notice}</p>}

      <div className="w-full sm:w-fit">
        <div role="tablist" aria-label="Tipos de atención técnica" className="grid grid-cols-2 overflow-hidden rounded-xl border border-app-border bg-app-muted p-1" onKeyDown={handleTabKeys}>
          <button id="support-tab" type="button" role="tab" aria-selected={queue === 'support'} aria-controls="support-panel" tabIndex={queue === 'support' ? 0 : -1} onClick={() => switchQueue('support')} className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors sm:min-w-[280px] ${queue === 'support' ? 'bg-app-surface text-app-accent shadow-sm' : 'text-app-secondary hover:text-app-primary'}`}>
            <Ticket className="h-5 w-5" aria-hidden="true" />Solicitudes e incidencias <span className={`rounded-full px-2 py-0.5 text-xs ${queue === 'support' ? 'bg-app-action text-white' : 'bg-app-border text-app-body'}`}>{tickets.length}</span>
          </button>
          <button id="changes-tab" type="button" role="tab" aria-selected={queue === 'changes'} aria-controls="changes-panel" tabIndex={queue === 'changes' ? 0 : -1} onClick={() => switchQueue('changes')} className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors sm:min-w-[220px] ${queue === 'changes' ? 'bg-app-surface text-violet-700 shadow-sm dark:text-violet-300' : 'text-app-secondary hover:text-app-primary'}`}>
            Cambios RFC <span className={`rounded-full px-2 py-0.5 text-xs ${queue === 'changes' ? 'bg-violet-700 text-white' : 'bg-app-border text-app-body'}`}>{rfcCount}</span>
          </button>
        </div>
      </div>

      <section id="support-panel" role="tabpanel" aria-labelledby="support-tab" className={queue === 'support' ? 'block' : 'hidden'}>
        <div className="grid items-start gap-3 lg:grid-cols-[minmax(330px,31%)_minmax(0,1fr)]">
          <section className={`technical-card min-w-0 overflow-hidden ${mobileDetail ? 'hidden lg:block' : 'block'}`} aria-label="Lista de solicitudes e incidencias">
            <header className="flex items-center justify-between border-b border-app-border p-4">
              <div><h2 className="font-bold text-app-primary">Tickets asignados a mí ({filteredTickets.length})</h2><p className="mt-1 text-xs text-app-secondary">Selecciona un ticket para gestionarlo</p></div>
              <SlidersHorizontal className="h-5 w-5 text-app-secondary" aria-hidden="true" />
            </header>
            <div className="grid grid-cols-2 gap-2 border-b border-app-border p-3">
              <label className="sr-only" htmlFor="support-status-filter">Estado</label>
              <select id="support-status-filter" value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="technical-field min-h-9 px-2 py-1.5 text-xs"><option value="all">Todos los estados</option>{states.map(value => <option key={value} value={value}>{labels[value]}</option>)}</select>
              <label className="sr-only" htmlFor="support-priority-filter">Prioridad</label>
              <select id="support-priority-filter" value={priorityFilter} onChange={event => setPriorityFilter(event.target.value)} className="technical-field min-h-9 px-2 py-1.5 text-xs"><option value="all">Toda prioridad</option>{['ALTA', 'MEDIA', 'BAJA'].map(value => <option key={value}>{value}</option>)}</select>
            </div>
            <div className="max-h-[680px] space-y-2 overflow-y-auto p-3">
              {loading ? <p className="p-8 text-center text-sm text-app-secondary">Cargando…</p> : visibleTickets.map(ticket => (
                <button type="button" key={ticket.id} aria-pressed={ticket.id === selectedId} onClick={() => chooseTicket(ticket.id)} className="technical-list-item grid w-full grid-cols-[80px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl p-3 text-left">
                  <span className="text-xs font-black text-app-accent">{ticket.code}</span>
                  <span className="min-w-0"><strong className="block truncate text-sm text-app-primary">{ticket.title}</strong><span className="mt-1 block truncate text-xs text-app-secondary">{ticket.area || ticket.requesterEmail} · {formatTechnicalDate(ticket.createdAt)}</span></span>
                  <span className="flex items-center gap-1"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${statusTone[ticket.status] || 'bg-app-muted text-app-body'}`}>{labels[ticket.status] || ticket.status}</span><ChevronRight className="h-4 w-4 text-app-secondary" /></span>
                </button>
              ))}
              {!loading && !visibleTickets.length && <div className="p-8 text-center text-app-secondary"><Wrench className="mx-auto mb-3 h-7 w-7" /><p className="text-sm font-semibold">No hay solicitudes que coincidan.</p><button type="button" onClick={() => { clearSearch(); setStatusFilter('all'); setPriorityFilter('all'); }} className="mt-3 text-xs font-bold text-app-accent">Limpiar filtros</button></div>}
            </div>
            {filteredTickets.length > PAGE_SIZE && <footer className="flex items-center justify-between border-t border-app-border p-3 text-xs text-app-secondary"><span>Página {page} de {totalPages}</span><div className="flex gap-2"><button type="button" disabled={page === 1} onClick={() => setPage(value => value - 1)} className="technical-button-secondary rounded-lg px-3 py-1.5">Anterior</button><button type="button" disabled={page === totalPages} onClick={() => setPage(value => value + 1)} className="technical-button-secondary rounded-lg px-3 py-1.5">Siguiente</button></div></footer>}
          </section>

          <section className={`technical-card min-w-0 overflow-hidden ${mobileDetail ? 'block' : 'hidden lg:block'}`} aria-label="Detalle de la solicitud seleccionada">
            {!selected ? <div className="grid min-h-[420px] place-items-center p-8 text-center text-app-secondary"><div><Wrench className="mx-auto mb-3 h-8 w-8" />Selecciona una solicitud.</div></div> : <div>
              <header className="border-b border-app-border p-4 sm:p-5">
                <button type="button" onClick={() => setMobileDetail(false)} className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-app-accent lg:hidden"><ArrowLeft className="h-4 w-4" />Volver a la bandeja</button>
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-lg bg-app-danger-soft text-app-accent"><Ticket className="h-5 w-5" /></span><span className="text-lg font-black text-app-primary">{selected.code}</span><span className={`rounded-full px-3 py-1 text-[10px] font-bold ${statusTone[selected.status] || 'bg-app-muted text-app-body'}`}>{labels[selected.status] || selected.status}</span></div><h2 className="mt-1 text-xl font-extrabold text-app-primary sm:text-2xl">{selected.title}</h2><p className="mt-1 text-sm text-app-secondary">{selected.category} · Solicitado por {selected.requesterEmail}</p></div>
                  <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[340px]"><div className="rounded-xl border border-app-border bg-app-muted/40 p-3"><span className="flex items-center gap-2 text-xs font-bold text-app-secondary"><CalendarDays className="h-4 w-4" />Creado</span><strong className="mt-1 block text-xs text-app-primary">{formatTechnicalDate(selected.createdAt)}</strong></div><div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30"><span className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-200"><Flag className="h-4 w-4" />Prioridad</span><strong className="mt-1 block text-xs text-amber-900 dark:text-amber-100">{selected.priority}</strong></div></div>
                </div>
              </header>

              <div className="space-y-5 p-4 sm:p-5">
                <TechnicalStageProgress stages={workflow.stages} label="Progreso de la solicitud" />

                {!assigned && <p className="rounded-xl border border-app-info-border bg-app-info p-4 text-sm text-app-body"><strong className="text-app-primary">Pendiente de asignación.</strong> Administración debe asignarte este ticket antes de que puedas intervenir.</p>}

                {workflow.current === 0 && <section className="technical-work-panel p-4" aria-labelledby="support-evaluation-title"><h3 id="support-evaluation-title" className="flex items-center gap-2 text-lg font-bold text-app-primary"><ClipboardCheck className="h-5 w-5 text-app-accent" />Evaluación técnica</h3><p className="mt-1 text-sm text-app-body">Registra el diagnóstico del problema y propone una solución.</p>{selected.proposalStatus === 'RECHAZADA' && <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"><strong>Observación administrativa:</strong> {selected.adminComment}</p>}<div className="mt-4 space-y-4"><label className="block text-sm font-semibold text-app-primary">Diagnóstico <span className="text-app-accent">*</span><textarea disabled={!assigned || proposalLocked} value={diagnosis} onChange={event => setDiagnosis(event.target.value)} rows={3} className={fieldClassName} placeholder="Describe el problema identificado, evidencia y su impacto..." /></label><label className="block text-sm font-semibold text-app-primary">Solución propuesta <span className="text-app-accent">*</span><textarea disabled={!assigned || proposalLocked} value={solution} onChange={event => setSolution(event.target.value)} rows={3} className={fieldClassName} placeholder="Indica las acciones recomendadas para su resolución..." /></label></div><div className="mt-4 flex flex-col justify-end gap-3 sm:flex-row"><button type="button" disabled title="Requiere soporte de archivos en el backend" className="technical-button-secondary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold"><Paperclip className="h-4 w-4" />Adjuntar evidencia</button><button disabled={busy || !assigned || proposalLocked || !diagnosis.trim() || !solution.trim()} onClick={() => action(() => submitSupportProposal(selected.id, diagnosis, solution))} className="inline-flex items-center justify-center gap-2 rounded-xl bg-app-action px-4 py-2.5 text-sm font-bold text-white hover:bg-app-action-hover disabled:opacity-40"><Check className="h-4 w-4" />{selected.proposalStatus === 'RECHAZADA' ? 'Reenviar evaluación' : 'Guardar evaluación'}</button></div></section>}

                {workflow.current === 1 && <section className="rounded-xl border border-amber-300 bg-amber-50/70 p-4 dark:border-amber-900 dark:bg-amber-950/30"><h3 className="flex items-center gap-2 text-lg font-bold text-app-primary"><Clock3 className="h-5 w-5 text-amber-600 dark:text-amber-300" />2. Autorización administrativa</h3><p className="mt-2 text-sm text-app-body">La propuesta fue enviada y permanece bloqueada hasta que administración emita su decisión.</p><div className="mt-4 grid gap-3 md:grid-cols-2"><div className="rounded-lg bg-app-surface p-3"><strong className="text-xs uppercase text-app-secondary">Diagnóstico enviado</strong><p className="mt-1 text-sm text-app-body">{selected.diagnosis}</p></div><div className="rounded-lg bg-app-surface p-3"><strong className="text-xs uppercase text-app-secondary">Solución enviada</strong><p className="mt-1 text-sm text-app-body">{selected.proposedSolution}</p></div></div>{selected.adminComment && <p className="mt-3 text-sm text-app-body"><strong>Observación:</strong> {selected.adminComment}</p>}</section>}

                {workflow.current === 2 && <section className={`rounded-xl border p-4 ${workflow.complete ? 'border-app-border bg-app-muted' : 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/30'}`}><h3 className="flex items-center gap-2 text-lg font-bold text-app-primary"><ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />3. Ejecución y cierre</h3><p className="mt-1 text-sm text-app-body">{workflow.complete ? 'La solución fue ejecutada y registrada.' : 'La ejecución fue autorizada por administración.'}</p><details className="mt-4 rounded-lg border border-app-border bg-app-surface p-3"><summary className="cursor-pointer text-sm font-bold text-app-primary">Evaluación autorizada</summary><div className="mt-3 grid gap-3 md:grid-cols-2"><p className="text-sm text-app-body"><strong className="block text-xs uppercase text-app-secondary">Diagnóstico</strong>{selected.diagnosis}</p><p className="text-sm text-app-body"><strong className="block text-xs uppercase text-app-secondary">Solución</strong>{selected.proposedSolution}</p></div>{selected.adminComment && <p className="mt-3 text-sm text-app-body"><strong>Observación administrativa:</strong> {selected.adminComment}</p>}</details>{workflow.complete ? <div className="mt-4 rounded-lg bg-app-surface p-4"><strong className="text-xs uppercase text-app-secondary">Evidencia o resultado</strong><p className="mt-2 whitespace-pre-wrap text-sm text-app-body">{selected.executionEvidence || 'Sin evidencia registrada.'}</p></div> : <><div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"><label className="text-sm font-semibold text-app-primary">Estado<select disabled={!approved || !assigned} value={status} onChange={event => setStatus(event.target.value)} className={`${fieldClassName} px-3 py-2.5`}>{allowedStates.map(value => <option key={value} value={value}>{labels[value]}</option>)}</select></label><button disabled={busy || !approved || !assigned} onClick={() => action(() => updateSupportTicketStatus(selected.id, status))} className="technical-button-secondary rounded-xl px-4 py-2.5 text-sm font-bold">Actualizar estado</button></div><label className="mt-4 block text-sm font-semibold text-app-primary">Evidencia o resultado<textarea disabled={!approved || !assigned} value={evidence} onChange={event => setEvidence(event.target.value)} rows={4} className={fieldClassName} placeholder="Registra el resultado y la evidencia técnica" /></label><div className="mt-4 flex justify-end"><button disabled={busy || !approved || !assigned || !evidence.trim()} onClick={() => action(() => registerSupportExecution(selected.id, evidence))} className="w-full rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-40 sm:w-auto">Registrar resolución</button></div></>}</section>}

                <details className="rounded-xl border border-app-border p-4"><summary className="cursor-pointer text-sm font-bold text-app-primary">Información del ticket</summary><div className="mt-3 grid gap-3 md:grid-cols-2"><div className="rounded-lg bg-app-muted p-3"><strong className="text-xs uppercase text-app-secondary">Solicitud formal</strong><p className="mt-2 whitespace-pre-wrap text-sm text-app-body">{selected.description}</p></div><div className="rounded-lg bg-app-muted p-3"><strong className="text-xs uppercase text-app-secondary">Justificación de prioridad</strong><p className="mt-2 text-sm text-app-body">{selected.priorityJustification}</p></div></div><dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4"><div><dt className="text-xs uppercase text-app-secondary">Área</dt><dd className="text-app-body">{selected.area}</dd></div><div><dt className="text-xs uppercase text-app-secondary">Técnico</dt><dd className="break-all text-app-body">{selected.technicianEmail || 'Sin asignar'}</dd></div><div><dt className="text-xs uppercase text-app-secondary">SLA</dt><dd className="text-app-body">{slaById.get(selected.id)?.slaStatus || 'Sin datos'}</dd></div><div><dt className="text-xs uppercase text-app-secondary">Límite SLA</dt><dd className="text-app-body">{formatTechnicalDate(slaById.get(selected.id)?.slaDeadline)}</dd></div></dl></details>

                <details className="rounded-xl border border-app-border p-4"><summary className="cursor-pointer text-sm font-bold text-app-primary">Historial del ticket</summary><dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3"><div><dt className="text-xs uppercase text-app-secondary">Creación</dt><dd className="text-app-body">{formatTechnicalDate(selected.createdAt)}</dd></div><div><dt className="text-xs uppercase text-app-secondary">Última actualización</dt><dd className="text-app-body">{formatTechnicalDate(selected.updatedAt)}</dd></div><div><dt className="text-xs uppercase text-app-secondary">Resolución</dt><dd className="text-app-body">{formatTechnicalDate(selected.resolvedAt)}</dd></div></dl></details>
              </div>
            </div>}
          </section>
        </div>
      </section>

      <div id="changes-panel" role="tabpanel" aria-labelledby="changes-tab" className={queue === 'changes' ? 'block' : 'hidden'}>
        <TechnicianChangePanel active={queue === 'changes'} onCountChange={setRfcCount} search={search} onClearSearch={clearSearch} />
      </div>
    </div>
  );
}
