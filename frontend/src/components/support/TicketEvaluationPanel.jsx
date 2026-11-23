import { ClipboardCheck } from 'lucide-react';
import { parseTicketEvaluation } from '../../utils/ticketClassification';

const priorityLabel = value => ({ BAJA: 'Baja', MEDIA: 'Media', ALTA: 'Alta' }[value] || value || 'Sin datos');
const priorityTone = value => value === 'ALTA'
  ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200'
  : value === 'MEDIA'
    ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
    : 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200';

export default function TicketEvaluationPanel({ ticket }) {
  const evaluation = parseTicketEvaluation(ticket?.priorityJustification);

  return <section className="rounded-xl border border-app-border bg-app-surface p-4" aria-labelledby={`ticket-evaluation-${ticket?.id}`}>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 id={`ticket-evaluation-${ticket?.id}`} className="flex items-center gap-2 text-sm font-bold text-app-primary"><ClipboardCheck className="h-4 w-4 text-app-accent" aria-hidden="true"/>Evaluación del ticket</h3>
      <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${priorityTone(ticket?.priority)}`}>Prioridad {priorityLabel(ticket?.priority)}</span>
    </div>
    {evaluation.automatic ? <>
      <p className="mt-2 text-xs text-app-secondary">Clasificación automática persistida con el ticket.</p>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
        <EvaluationValue label="Alcance" value={evaluation.scope}/>
        <EvaluationValue label="Impacto" value={evaluation.impact}/>
        <EvaluationValue label="Urgencia" value={evaluation.urgency}/>
        <EvaluationValue label="Continuidad" value={evaluation.continuity}/>
        <EvaluationValue label="Frecuencia" value={evaluation.frequency}/>
        <EvaluationValue label="Probabilidad" value={evaluation.probability}/>
        <EvaluationValue label="Riesgo de matriz" value={evaluation.risk}/>
        <EvaluationValue label="Prioridad sugerida" value={evaluation.suggestedPriority}/>
      </dl>
      {evaluation.rule&&<p className="mt-4 rounded-lg bg-app-muted p-3 text-sm text-app-body"><strong className="text-app-primary">Regla aplicada:</strong> {evaluation.rule}</p>}
    </>:<div className="mt-3 rounded-lg bg-app-muted p-3 text-sm text-app-body">
      <p className="font-semibold text-app-primary">Evaluación estructurada no disponible.</p>
      <p className="mt-1">{evaluation.justification || 'El ticket no contiene una justificación de prioridad.'}</p>
    </div>}
  </section>;
}

function EvaluationValue({ label, value }) {
  return <div><dt className="text-xs font-bold uppercase tracking-wide text-app-secondary">{label}</dt><dd className="mt-1 text-app-body">{value || 'Sin datos'}</dd></div>;
}
