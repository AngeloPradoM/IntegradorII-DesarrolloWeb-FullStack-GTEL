export const incidentStatusLabels = {
  REGISTRADO: 'Registrado', CLASIFICADO: 'Clasificado', ASIGNADO: 'Asignado',
  EN_INVESTIGACION: 'En investigación', EN_MITIGACION: 'En mitigación',
  SERVICIO_RECUPERADO: 'Servicio recuperado', VERIFICADO: 'Verificado', CERRADO: 'Cerrado',
};

export const incidentStatusTone = {
  REGISTRADO: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-200',
  CLASIFICADO: 'bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-200',
  ASIGNADO: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  EN_INVESTIGACION: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200',
  EN_MITIGACION: 'bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-200',
  SERVICIO_RECUPERADO: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200',
  VERIFICADO: 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-200',
  CERRADO: 'bg-app-muted text-app-body',
};

export const incidentDisplayStatusLabels = {
  NUEVO: 'Nuevo', EN_DIAGNOSTICO: 'En diagnóstico', EN_ATENCION: 'En atención',
  ESCALADO: 'Escalado', RESUELTO: 'Resuelto', CERRADO: 'Cerrado',
};

export const incidentDisplayStatusTone = {
  NUEVO: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-200',
  EN_DIAGNOSTICO: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200',
  EN_ATENCION: 'bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-200',
  ESCALADO: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200',
  RESUELTO: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200',
  CERRADO: 'bg-app-muted text-app-body',
};

export const internalToDisplayStatus = {
  REGISTRADO: 'NUEVO', CLASIFICADO: 'NUEVO', ASIGNADO: 'NUEVO',
  EN_INVESTIGACION: 'EN_DIAGNOSTICO', EN_MITIGACION: 'EN_ATENCION',
  SERVICIO_RECUPERADO: 'RESUELTO', VERIFICADO: 'RESUELTO', CERRADO: 'CERRADO',
};

export const displayStatusOf = incident => incident?.displayStatus
  || (incident?.activeEscalation && incident?.status !== 'CERRADO' ? 'ESCALADO' : internalToDisplayStatus[incident?.status]);

export const priorityTone = {
  P1: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200',
  P2: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-200',
  P3: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200',
  P4: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200',
};

export const formatIncidentDate = value => {
  const normalized = typeof value === 'string' && !/(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    ? `${value}-05:00`
    : value;
  const date = new Date(normalized);
  return value && !Number.isNaN(date.getTime())
    ? new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Lima' }).format(date)
    : 'Sin fecha';
};

export const localDateTimeValue = date => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date).reduce((values, part) => ({ ...values, [part.type]: part.value }), {});
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};

export const technicalIncidentTransitions = {
  ASIGNADO: [['EN_INVESTIGACION', 'Iniciar investigación']],
  EN_INVESTIGACION: [['EN_MITIGACION', 'Iniciar mitigación'], ['SERVICIO_RECUPERADO', 'Registrar recuperación']],
  EN_MITIGACION: [['SERVICIO_RECUPERADO', 'Registrar recuperación']],
};
