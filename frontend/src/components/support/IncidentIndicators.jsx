import { AlertTriangle, CheckCircle2, Clock3, Layers3, ListChecks, Repeat2, ServerCrash } from 'lucide-react';
import { incidentDisplayStatusLabels } from '../../utils/incidentUi';

const hours = value => value == null ? '—' : `${Number(value).toFixed(2)} h`;

export default function IncidentIndicators({ data, categories = [], loading = false }) {
  if (!loading && !data) return <section aria-label="Indicadores de incidentes" className="rounded-xl border border-app-border bg-app-surface p-4 text-sm text-app-secondary">Indicadores no disponibles. Reintenta la consulta.</section>;
  const metrics = [
    [ServerCrash,'Total',data?.total??0],
    [ListChecks,'Abiertos',data?.open??0],
    [CheckCircle2,'Cerrados',data?.closed??0],
    [Clock3,'Prom. atención',hours(data?.averageAttentionHours)],
    [Clock3,'Prom. solución',hours(data?.averageResolutionHours)],
    [AlertTriangle,'Vencidos',data?.overdue??0],
    [Repeat2,'Fallas repetidas',data?.repeatedFailures??0],
  ];
  return <section aria-label="Indicadores de incidentes" className="space-y-3">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
      {metrics.map(([Icon,label,value])=><article key={label} className="rounded-xl border border-app-border bg-app-surface p-3 shadow-sm"><span className="flex items-center gap-2 text-xs font-bold text-app-secondary"><Icon className="h-4 w-4 text-app-accent"/>{label}</span><strong className="mt-2 block text-xl font-black text-app-primary">{loading?'…':value}</strong></article>)}
    </div>
    <div className="grid gap-3 lg:grid-cols-3">
      <Breakdown title="Por categoría" icon={Layers3} rows={data?.byCategory} label={key=>categories.find(item=>item.code===key)?.name||key}/>
      <Breakdown title="Por prioridad" icon={AlertTriangle} rows={data?.byPriority}/>
      <Breakdown title="Por estado" icon={ListChecks} rows={data?.byStatus} label={key=>incidentDisplayStatusLabels[key]||key}/>
    </div>
  </section>;
}

function Breakdown({title,icon:Icon,rows=[],label=value=>value}){
  return <details className="rounded-xl border border-app-border bg-app-surface p-3"><summary className="flex cursor-pointer items-center gap-2 text-sm font-bold text-app-primary"><Icon className="h-4 w-4 text-app-accent"/>{title}</summary>{rows.length?<ul className="mt-3 space-y-2">{rows.map(item=><li key={item.key} className="flex items-center justify-between gap-3 rounded-lg bg-app-muted px-3 py-2 text-xs text-app-body"><span>{label(item.key)}</span><strong className="text-app-primary">{item.count}</strong></li>)}</ul>:<p className="mt-3 text-xs text-app-secondary">Sin datos para los filtros activos.</p>}</details>;
}
