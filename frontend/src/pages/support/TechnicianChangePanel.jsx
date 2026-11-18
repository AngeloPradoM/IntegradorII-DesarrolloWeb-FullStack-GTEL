import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, CheckCircle2, ChevronRight, Download, FileCog, RefreshCw, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import TechnicalStageProgress from '../../components/technical/TechnicalStageProgress';
import { formatTechnicalDate, getChangeWorkflow } from '../../utils/technicalWorkflow';
import {
  downloadChangeDocument,
  listChangeRequests,
  registerChangeExecution,
  submitChangeTechnicalReview,
} from '../../services/changeManagementService';

const PAGE_SIZE = 6;
const reviewInitial = { technicalEvaluation: '', implementationPlan: '', testPlan: '', rollbackPlan: '', communicationPlan: '' };
const executionInitial = { evidence: '', result: 'EXITOSO', lessonsLearned: '' };
const labels = {
  REGISTRADO: 'Registrado', ASIGNADO: 'Asignado', PENDIENTE_APROBACION: 'Pendiente de aprobación', APROBADO: 'Aprobado', AJUSTES_SOLICITADOS: 'Requiere ajustes', EN_VALIDACION: 'En validación', OBSERVADO: 'Observado', CERRADO: 'Cerrado',
};
const statusTone = {
  REGISTRADO: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-200',
  ASIGNADO: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  PENDIENTE_APROBACION: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200',
  APROBADO: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200',
  AJUSTES_SOLICITADOS: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-200',
  EN_VALIDACION: 'bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-200',
  OBSERVADO: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200',
  CERRADO: 'bg-app-muted text-app-body',
};
const priorityTone = {
  CRITICA: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200',
  ALTA: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-200',
  MEDIA: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200',
  BAJA: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200',
};
const fieldClassName = 'technical-field mt-1 w-full p-3 text-sm';

export default function TechnicianChangePanel({ active, onCountChange, search = '', onClearSearch }) {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [review, setReview] = useState(reviewInitial);
  const [execution, setExecution] = useState(executionInitial);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [mobileDetail, setMobileDetail] = useState(false);

  const selected = useMemo(() => rows.find(row => row.id === selectedId) || null, [rows, selectedId]);
  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter(change => {
      const matchesSearch = !term || [change.code, change.title, change.category, change.requesterEmail, change.affectedAreas]
        .some(value => String(value || '').toLowerCase().includes(term));
      return matchesSearch
        && (statusFilter === 'all' || change.status === statusFilter)
        && (priorityFilter === 'all' || change.priority === priorityFilter);
    });
  }, [priorityFilter, rows, search, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const visibleRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const load = async signal => {
    setLoading(true);
    try {
      const data = await listChangeRequests(signal);
      const safeRows = Array.isArray(data) ? data : [];
      setRows(safeRows);
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
  useEffect(() => { onCountChange?.(rows.length); }, [onCountChange, rows.length]);
  useEffect(() => {
    if (!selected) return;
    setReview({
      technicalEvaluation: selected.technicalEvaluation || '', implementationPlan: selected.implementationPlan || '', testPlan: selected.testPlan || '', rollbackPlan: selected.rollbackPlan || '', communicationPlan: selected.communicationPlan || '',
    });
    setExecution({ evidence: selected.executionEvidence || '', result: selected.result || 'EXITOSO', lessonsLearned: selected.lessonsLearned || '' });
  }, [selected]);
  useEffect(() => setPage(1), [search, statusFilter, priorityFilter]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const run = async callback => {
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const updated = await callback();
      if (updated?.id) setRows(values => values.map(value => value.id === updated.id ? updated : value));
      setNotice('Gestión de cambio actualizada.');
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  };

  const assigned = selected?.implementerEmail?.toLowerCase() === user.email.toLowerCase();
  const reviewEnabled = assigned && ['ASIGNADO', 'AJUSTES_SOLICITADOS'].includes(selected?.status);
  const executionEnabled = assigned && ['APROBADO', 'OBSERVADO'].includes(selected?.status);
  const workflow = getChangeWorkflow(selected);
  const category = String(selected?.category || '').replaceAll('_', ' ');
  const chooseChange = id => { setSelectedId(id); setMobileDetail(true); };

  return (
    <section data-active={active} aria-label="Bandeja de cambios RFC">
      {rows.some(row => row.status === 'REGISTRADO') && <p className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"><AlertTriangle className="h-5 w-5 shrink-0" />Hay gestiones de cambio pendientes de asignación administrativa.</p>}
      {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">{error}</p>}
      {notice && <p role="status" className="mb-4 flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"><CheckCircle2 className="h-5 w-5 shrink-0" />{notice}</p>}

      <div className="grid items-start gap-3 lg:grid-cols-[minmax(330px,31%)_minmax(0,1fr)]">
        <section className={`technical-card min-w-0 overflow-hidden ${mobileDetail ? 'hidden lg:block' : 'block'}`} aria-label="Lista de cambios RFC">
          <header className="flex items-center justify-between border-b border-app-border p-4"><div><h2 className="font-bold text-app-primary">Cambios asignados a mí ({filteredRows.length})</h2><p className="mt-1 text-xs text-app-secondary">Selecciona una RFC para gestionarla</p></div><button type="button" onClick={() => load()} disabled={loading} className="technical-button-secondary rounded-lg p-2" aria-label="Actualizar cambios RFC"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button></header>
          <div className="grid grid-cols-2 gap-2 border-b border-app-border p-3"><label className="sr-only" htmlFor="change-status-filter">Estado RFC</label><select id="change-status-filter" value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="technical-field min-h-9 px-2 py-1.5 text-xs"><option value="all">Todos los estados</option>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><label className="sr-only" htmlFor="change-priority-filter">Prioridad RFC</label><select id="change-priority-filter" value={priorityFilter} onChange={event => setPriorityFilter(event.target.value)} className="technical-field min-h-9 px-2 py-1.5 text-xs"><option value="all">Toda prioridad</option>{['CRITICA', 'ALTA', 'MEDIA', 'BAJA'].map(value => <option key={value}>{value}</option>)}</select></div>
          <div className="max-h-[680px] space-y-2 overflow-y-auto p-3">
            {loading ? <p className="p-8 text-center text-sm text-app-secondary">Cargando RFC…</p> : visibleRows.map(change => <button type="button" key={change.id} aria-pressed={change.id === selectedId} onClick={() => chooseChange(change.id)} className="technical-list-item technical-rfc-item grid w-full grid-cols-[80px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl p-3 text-left"><strong className="text-xs text-violet-700 dark:text-violet-300">{change.code}</strong><span className="min-w-0"><span className="block truncate text-sm font-bold text-app-primary">{change.title}</span><span className="mt-1 block truncate text-xs text-app-secondary">{change.affectedAreas || change.category} · {formatTechnicalDate(change.createdAt)}</span></span><span className="flex items-center gap-1"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${statusTone[change.status] || 'bg-app-muted text-app-body'}`}>{labels[change.status] || change.status}</span><ChevronRight className="h-4 w-4 text-app-secondary" /></span></button>)}
            {!loading && !visibleRows.length && <div className="p-8 text-center text-app-secondary"><FileCog className="mx-auto mb-3 h-7 w-7" /><p className="text-sm font-semibold">No hay RFC que coincidan.</p><button type="button" onClick={() => { onClearSearch?.(); setStatusFilter('all'); setPriorityFilter('all'); }} className="mt-3 text-xs font-bold text-violet-700 dark:text-violet-300">Limpiar filtros</button></div>}
          </div>
          {filteredRows.length > PAGE_SIZE && <footer className="flex items-center justify-between border-t border-app-border p-3 text-xs text-app-secondary"><span>Página {page} de {totalPages}</span><div className="flex gap-2"><button type="button" disabled={page === 1} onClick={() => setPage(value => value - 1)} className="technical-button-secondary rounded-lg px-3 py-1.5">Anterior</button><button type="button" disabled={page === totalPages} onClick={() => setPage(value => value + 1)} className="technical-button-secondary rounded-lg px-3 py-1.5">Siguiente</button></div></footer>}
        </section>

        <section className={`technical-card min-w-0 overflow-hidden ${mobileDetail ? 'block' : 'hidden lg:block'}`} aria-label="Detalle del cambio RFC seleccionado">
          {!selected ? <p className="p-10 text-center text-app-secondary">Selecciona una RFC.</p> : <div>
            <header className="border-b border-app-border p-4 sm:p-5"><button type="button" onClick={() => setMobileDetail(false)} className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-violet-700 dark:text-violet-300 lg:hidden"><ArrowLeft className="h-4 w-4" />Volver a la bandeja</button><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-black text-violet-700 dark:text-violet-300">{selected.code}</span><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${priorityTone[selected.priority] || 'bg-app-muted text-app-body'}`}>{selected.priority}</span></div><h2 className="mt-2 text-xl font-bold text-app-primary sm:text-2xl">{selected.title}</h2><p className="mt-1 text-sm text-app-secondary">{category} · {selected.type} · Impacto {selected.impact}</p></div><div className="flex flex-col items-start gap-2 sm:items-end"><span className={`rounded-full px-3 py-1.5 text-xs font-black ${statusTone[selected.status] || 'bg-app-muted text-app-body'}`}>{labels[selected.status] || selected.status}</span><button type="button" disabled={!assigned} title={assigned ? 'Descargar documento RFC' : 'La RFC debe estar asignada a tu cuenta'} onClick={() => run(() => downloadChangeDocument(selected))} className="technical-button-secondary inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-40"><Download className="h-4 w-4" />Descargar RFC</button></div></div></header>

            <div className="space-y-5 p-4 sm:p-5">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"><div className="rounded-xl bg-app-muted p-3"><span className="text-[10px] font-bold uppercase text-app-secondary">Solicitante</span><strong className="mt-1 block break-all text-xs text-app-primary">{selected.requesterEmail}</strong></div><div className="rounded-xl bg-app-muted p-3"><span className="text-[10px] font-bold uppercase text-app-secondary">Implementador</span><strong className="mt-1 block break-all text-xs text-app-primary">{selected.implementerEmail || 'Sin asignar'}</strong></div><div className="rounded-xl bg-app-muted p-3"><span className="text-[10px] font-bold uppercase text-app-secondary">Fecha de creación</span><strong className="mt-1 block text-xs text-app-primary">{formatTechnicalDate(selected.createdAt)}</strong></div></div>

              <TechnicalStageProgress stages={workflow.stages} label="Progreso del cambio RFC" />

              <details className="rounded-xl border border-app-border p-4" open><summary className="cursor-pointer text-sm font-bold text-app-primary">Información del cambio</summary><div className="mt-3 grid gap-3 md:grid-cols-2"><div className="rounded-lg bg-app-muted p-3"><strong className="text-xs uppercase text-app-secondary">Descripción</strong><p className="mt-2 whitespace-pre-wrap text-sm text-app-body">{selected.description}</p></div><div className="rounded-lg bg-app-muted p-3"><strong className="text-xs uppercase text-app-secondary">Justificación y áreas</strong><p className="mt-2 whitespace-pre-wrap text-sm text-app-body">{selected.justification}</p><p className="mt-2 text-sm text-app-body"><strong>Áreas:</strong> {selected.affectedAreas}</p></div></div></details>

              {!assigned && <p className="rounded-xl border border-app-info-border bg-app-info p-3 text-sm text-app-body"><strong className="text-app-primary">Pendiente de asignación.</strong> Administración debe asignarte como responsable antes de intervenir.</p>}

              {workflow.current === 0 && <form onSubmit={event => { event.preventDefault(); run(() => submitChangeTechnicalReview(selected.id, review)); }} className="rounded-xl border border-app-border p-4"><h3 className="flex items-center gap-2 text-lg font-bold text-app-primary"><FileCog className="h-5 w-5 text-violet-700 dark:text-violet-300" />1. Evaluación y planificación</h3><p className="mt-1 text-sm text-app-body">Completa la revisión técnica y los planes requeridos antes de solicitar aprobación.</p>{selected.status === 'AJUSTES_SOLICITADOS' && selected.cabComment && <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"><strong>Ajustes solicitados:</strong> {selected.cabComment}</p>}<div className="mt-4 grid gap-4 md:grid-cols-2">{[['technicalEvaluation', 'Evaluación técnica'], ['implementationPlan', 'Plan de implementación'], ['testPlan', 'Plan de pruebas'], ['rollbackPlan', 'Plan de retorno'], ['communicationPlan', 'Plan de comunicación']].map(([key, label]) => <label key={key} className={`text-sm font-semibold text-app-primary ${key === 'technicalEvaluation' ? 'md:col-span-2' : ''}`}>{label}<textarea className={fieldClassName} rows={key === 'technicalEvaluation' ? 3 : 4} disabled={!reviewEnabled} required value={review[key]} onChange={event => setReview(previous => ({ ...previous, [key]: event.target.value }))} placeholder={`Describe: ${label.toLowerCase()}`} /></label>)}</div><div className="mt-4 flex justify-end"><button disabled={busy || !reviewEnabled} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-violet-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-800 disabled:opacity-40 sm:w-auto"><Send className="h-4 w-4" />Enviar para aprobación</button></div></form>}

              {workflow.current > 0 && <details className="rounded-xl border border-app-border p-4"><summary className="cursor-pointer text-sm font-bold text-app-primary">Evaluación y planes registrados</summary><div className="mt-3 grid gap-3 md:grid-cols-2">{[['Evaluación técnica', selected.technicalEvaluation], ['Implementación', selected.implementationPlan], ['Pruebas', selected.testPlan], ['Retorno', selected.rollbackPlan], ['Comunicación', selected.communicationPlan]].map(([label, value]) => <div key={label} className="rounded-lg bg-app-muted p-3"><strong className="text-xs uppercase text-app-secondary">{label}</strong><p className="mt-1 whitespace-pre-wrap text-sm text-app-body">{value || 'Sin información.'}</p></div>)}</div></details>}

              {workflow.current === 1 && <section className="rounded-xl border border-amber-300 bg-amber-50/70 p-4 dark:border-amber-900 dark:bg-amber-950/30"><h3 className="text-lg font-bold text-app-primary">2. Autorización</h3><p className="mt-2 text-sm text-app-body">La evaluación está pendiente de la decisión administrativa. El técnico no puede aprobar este cambio.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-lg bg-app-surface p-3"><strong className="text-xs uppercase text-app-secondary">Estado</strong><p className="mt-1 text-sm font-semibold text-app-primary">{labels[selected.status]}</p></div><div className="rounded-lg bg-app-surface p-3"><strong className="text-xs uppercase text-app-secondary">Participantes CAB</strong><p className="mt-1 text-sm text-app-body">{selected.cabMembers || 'Pendiente de revisión.'}</p></div></div>{selected.cabComment && <p className="mt-3 text-sm text-app-body"><strong>Observación:</strong> {selected.cabComment}</p>}</section>}

              {workflow.current === 2 && <section className={`rounded-xl border p-4 ${workflow.complete ? 'border-app-border bg-app-muted' : 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/30'}`}><h3 className="text-lg font-bold text-app-primary">3. Ejecución y PIR</h3><p className="mt-1 text-sm text-app-body">{workflow.complete ? 'El cambio fue validado y cerrado.' : selected.status === 'EN_VALIDACION' ? 'La ejecución fue registrada y espera validación del solicitante.' : 'Registra resultado, evidencia y lecciones aprendidas.'}</p><details className="mt-4 rounded-lg border border-app-border bg-app-surface p-3"><summary className="cursor-pointer text-sm font-bold text-app-primary">Información de autorización</summary><dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-xs uppercase text-app-secondary">Nivel de riesgo</dt><dd className="text-app-body">{selected.riskLevel || 'Sin dato'}</dd></div><div><dt className="text-xs uppercase text-app-secondary">Participantes CAB</dt><dd className="text-app-body">{selected.cabMembers || 'Sin dato'}</dd></div><div className="sm:col-span-2"><dt className="text-xs uppercase text-app-secondary">Observación</dt><dd className="text-app-body">{selected.cabComment || 'Sin observaciones.'}</dd></div></dl></details>{executionEnabled ? <form onSubmit={event => { event.preventDefault(); run(() => registerChangeExecution(selected.id, execution)); }}><label className="mt-4 block text-sm font-semibold text-app-primary">Resultado<select className={fieldClassName} disabled={!executionEnabled} value={execution.result} onChange={event => setExecution({ ...execution, result: event.target.value })}>{['EXITOSO', 'PARCIAL', 'FALLIDO', 'REVERTIDO'].map(value => <option key={value}>{value}</option>)}</select></label><div className="grid gap-4 md:grid-cols-2"><label className="mt-4 block text-sm font-semibold text-app-primary">Evidencia<textarea className={fieldClassName} rows={3} required disabled={!executionEnabled} value={execution.evidence} onChange={event => setExecution({ ...execution, evidence: event.target.value })} /></label><label className="mt-4 block text-sm font-semibold text-app-primary">Lecciones aprendidas<textarea className={fieldClassName} rows={3} required disabled={!executionEnabled} value={execution.lessonsLearned} onChange={event => setExecution({ ...execution, lessonsLearned: event.target.value })} /></label></div><div className="mt-4 flex justify-end"><button disabled={busy || !executionEnabled} className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-40 sm:w-auto">Registrar ejecución</button></div></form> : <div className="mt-4 grid gap-3 md:grid-cols-2"><div className="rounded-lg bg-app-surface p-3"><strong className="text-xs uppercase text-app-secondary">Resultado y evidencia</strong><p className="mt-2 text-sm text-app-body">{selected.result || 'Sin resultado'} · {selected.executionEvidence || 'Sin evidencia'}</p></div><div className="rounded-lg bg-app-surface p-3"><strong className="text-xs uppercase text-app-secondary">Lecciones aprendidas</strong><p className="mt-2 text-sm text-app-body">{selected.lessonsLearned || 'Sin información.'}</p></div>{selected.validationComment && <p className="rounded-lg bg-app-surface p-3 text-sm text-app-body md:col-span-2"><strong>Validación del solicitante:</strong> {selected.validationComment}</p>}</div>}</section>}

              <details className="rounded-xl border border-app-border p-4"><summary className="cursor-pointer text-sm font-bold text-app-primary">Historial del cambio</summary><dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-5"><div><dt className="text-xs uppercase text-app-secondary">Creación</dt><dd className="text-app-body">{formatTechnicalDate(selected.createdAt)}</dd></div><div><dt className="text-xs uppercase text-app-secondary">Actualización</dt><dd className="text-app-body">{formatTechnicalDate(selected.updatedAt)}</dd></div><div><dt className="text-xs uppercase text-app-secondary">Aprobación</dt><dd className="text-app-body">{formatTechnicalDate(selected.approvedAt)}</dd></div><div><dt className="text-xs uppercase text-app-secondary">Implementación</dt><dd className="text-app-body">{formatTechnicalDate(selected.implementedAt)}</dd></div><div><dt className="text-xs uppercase text-app-secondary">Cierre</dt><dd className="text-app-body">{formatTechnicalDate(selected.closedAt)}</dd></div></dl></details>
            </div>
          </div>}
        </section>
      </div>
    </section>
  );
}
