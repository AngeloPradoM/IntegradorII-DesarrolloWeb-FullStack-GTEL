import { useEffect, useState } from 'react';
import { localDateTimeValue } from '../../utils/incidentUi';

const initial = () => ({
  title: '', component: '', type: '', incidentTypeCode: '', moduleCode: '', description: '',
  scope: 'LIMITADO', impact: 'MEDIO', urgency: 'MEDIA', essentialProcess: false,
  workaroundAvailable: false, serviceBlocked: false, repeatedFailure: false,
  previousIncidentId: '', source: 'MANUAL', detectedAt: localDateTimeValue(new Date()),
  startedAt: '', recoveredAt: '',
  confirmDistinctIncident: false, distinctReason: '',
});

export default function IncidentCreateForm({
  onSubmit, busy, allowOverride = false, allowRepeated = true, categories = [], problemTypes = [],
  incidentOptions = [],
}) {
  const [form, setForm] = useState(initial);
  const field = 'technical-field mt-1 w-full px-3 py-2.5 text-sm';
  const now = localDateTimeValue(new Date());
  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));

  useEffect(() => {
    if (!problemTypes.length || !categories.length) return;
    setForm(current => {
      if (current.incidentTypeCode) return current;
      const problem = problemTypes[0];
      const category = categories.find(item => item.code === problem.categoryCode);
      return { ...current, incidentTypeCode: problem.code, type: problem.code,
        moduleCode: category?.moduleCode || '' };
    });
  }, [categories, problemTypes]);

  const selectProblem = code => {
    const problem = problemTypes.find(item => item.code === code);
    const category = categories.find(item => item.code === problem?.categoryCode);
    setForm(current => ({ ...current, incidentTypeCode: code, type: code,
      moduleCode: category?.moduleCode || '' }));
  };

  const submit = async event => {
    event.preventDefault();
    const payload = {
      ...form,
      startedAt: form.startedAt || null,
      recoveredAt: form.recoveredAt || null,
      previousIncidentId: form.repeatedFailure && form.previousIncidentId
        ? Number(form.previousIncidentId) : null,
    };
    const created = await onSubmit(payload);
    if (created !== false) {
      const reset = initial();
      const problem = problemTypes[0];
      const category = categories.find(item => item.code === problem?.categoryCode);
      reset.incidentTypeCode = problem?.code || '';
      reset.type = problem?.code || '';
      reset.moduleCode = category?.moduleCode || '';
      setForm(reset);
    }
  };

  return <form onSubmit={submit} className="space-y-4" aria-label="Registrar incidente de producción">
    <div className="grid gap-3 md:grid-cols-2">
      <label className="text-sm font-semibold text-app-primary">Título *
        <input required maxLength={180} className={field} value={form.title} onChange={event=>update('title',event.target.value)}/>
      </label>
      <label className="text-sm font-semibold text-app-primary">Componente afectado *
        <input required maxLength={100} className={field} value={form.component} onChange={event=>update('component',event.target.value)}/>
      </label>
      <label className="text-sm font-semibold text-app-primary">Problema técnico *
        <select required className={field} value={form.incidentTypeCode} onChange={event=>selectProblem(event.target.value)}>
          <option value="" disabled>Selecciona un problema</option>
          {problemTypes.map(item=><option key={item.code} value={item.code}>{item.code} · {item.name}</option>)}
        </select>
      </label>
      <label className="text-sm font-semibold text-app-primary">Categoría derivada
        <input readOnly className={field} value={categories.find(item=>item.moduleCode===form.moduleCode)?.name||''}/>
      </label>
      <label className="text-sm font-semibold text-app-primary">Alcance *
        <select className={field} value={form.scope} onChange={event=>update('scope',event.target.value)}><option value="LIMITADO">Limitado</option><option value="MULTIPLE">Múltiple</option><option value="GENERAL">General</option></select>
      </label>
      <label className="text-sm font-semibold text-app-primary">Impacto *
        <select className={field} value={form.impact} onChange={event=>update('impact',event.target.value)}>{['BAJO','MEDIO','ALTO','CRITICO'].map(value=><option key={value}>{value}</option>)}</select>
      </label>
      <label className="text-sm font-semibold text-app-primary">Urgencia *
        <select className={field} value={form.urgency} onChange={event=>update('urgency',event.target.value)}>{['BAJA','MEDIA','ALTA','INMEDIATA'].map(value=><option key={value}>{value}</option>)}</select>
      </label>
      <label className="text-sm font-semibold text-app-primary">Detectado *
        <input required type="datetime-local" max={now} className={field} value={form.detectedAt} onChange={event=>update('detectedAt',event.target.value)}/>
      </label>
      <label className="text-sm font-semibold text-app-primary">Inicio estimado
        <input type="datetime-local" max={form.detectedAt||now} className={field} value={form.startedAt} onChange={event=>update('startedAt',event.target.value)}/>
      </label>
      <label className="text-sm font-semibold text-app-primary">Canal de detección
        <select className={field} value={form.source} onChange={event=>update('source',event.target.value)}><option value="MANUAL">Comunicación o detección manual</option><option value="MONITOREO">Monitoreo técnico</option></select>
      </label>
      <label className="text-sm font-semibold text-app-primary">Recuperación real (registro retrospectivo)
        <input type="datetime-local" min={form.detectedAt||undefined} max={now} className={field} value={form.recoveredAt} onChange={event=>update('recoveredAt',event.target.value)}/>
      </label>
    </div>
    <label className="block text-sm font-semibold text-app-primary">Descripción *
      <textarea required maxLength={5000} rows={4} className={field} value={form.description} onChange={event=>update('description',event.target.value)}/>
    </label>
    <div className="grid gap-3 text-sm text-app-body sm:grid-cols-3">
      <label className="flex items-center gap-2"><input type="checkbox" checked={form.essentialProcess} onChange={event=>update('essentialProcess',event.target.checked)}/>Afecta proceso esencial</label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={form.serviceBlocked} onChange={event=>update('serviceBlocked',event.target.checked)}/>Servicio bloqueado</label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={form.workaroundAvailable} onChange={event=>update('workaroundAvailable',event.target.checked)}/>Existe solución temporal</label>
    </div>
    {allowRepeated&&<div className="rounded-xl border border-app-border bg-app-muted p-3">
      <label className="flex items-center gap-2 text-sm font-semibold text-app-primary">
        <input type="checkbox" checked={form.repeatedFailure} onChange={event=>{update('repeatedFailure',event.target.checked);if(!event.target.checked)update('previousIncidentId','');}}/>Es una falla repetida
      </label>
      {form.repeatedFailure&&<label className="mt-3 block text-sm font-semibold text-app-primary">Incidente anterior *
        <select required className={field} value={form.previousIncidentId} onChange={event=>update('previousIncidentId',event.target.value)}>
          <option value="">Selecciona el antecedente</option>
          {incidentOptions.map(item=><option key={item.id} value={item.id}>{item.code} · {item.title}</option>)}
        </select>
      </label>}
    </div>}
    {allowOverride&&<div className="rounded-xl border border-app-border bg-app-muted p-3">
      <label className="flex items-center gap-2 text-sm font-semibold text-app-primary"><input type="checkbox" checked={form.confirmDistinctIncident} onChange={event=>update('confirmDistinctIncident',event.target.checked)}/>Confirmar incidente distinto si el servidor detecta coincidencias</label>
      {form.confirmDistinctIncident&&<label className="mt-3 block text-sm font-semibold text-app-primary">Justificación *<textarea required maxLength={500} rows={2} className={field} value={form.distinctReason} onChange={event=>update('distinctReason',event.target.value)}/></label>}
    </div>}
    <div className="flex justify-end"><button disabled={busy||!categories.length||!problemTypes.length} className="rounded-xl bg-app-action px-4 py-2.5 text-sm font-bold text-white hover:bg-app-action-hover disabled:opacity-50">Registrar incidente</button></div>
  </form>;
}
