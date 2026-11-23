import { Check } from 'lucide-react';

const stateLabel = { complete: 'Completada', active: 'Etapa actual', pending: 'Pendiente' };

export default function TechnicalStageProgress({ stages, label }) {
  return (
    <ol aria-label={label} className="grid gap-2 rounded-xl border border-app-border bg-app-muted/40 p-3 sm:grid-cols-3 sm:gap-0 sm:p-4">
      {stages.map((stage, index) => (
        <li
          key={stage.label}
          aria-current={stage.state === 'active' ? 'step' : undefined}
          className={`relative flex min-w-0 items-center gap-3 rounded-lg px-2 py-2 transition-colors ${stage.state === 'active' ? 'text-app-accent' : stage.state === 'complete' ? 'text-emerald-700 dark:text-emerald-300' : 'text-app-secondary'}`}
        >
          {index > 0 && <span className={`absolute right-[calc(100%-0.5rem)] top-1/2 hidden h-px w-[calc(100%-3rem)] -translate-y-1/2 sm:block ${stage.state === 'pending' ? 'bg-app-border-strong' : 'bg-app-action'}`} aria-hidden="true" />}
          <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-black ${
            stage.state === 'complete'
              ? 'bg-emerald-700 text-white'
              : stage.state === 'active'
                ? 'bg-app-action text-white'
                : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
          }`}>
            {stage.state === 'complete' ? <Check className="h-4 w-4" aria-hidden="true" /> : index + 1}
          </span>
          <span className="min-w-0">
            <strong className="block text-xs leading-tight text-app-primary sm:text-sm">{stage.label}</strong>
            <small className="block text-[11px] opacity-80">{stateLabel[stage.state]}</small>
          </span>
        </li>
      ))}
    </ol>
  );
}
