const buildStages = (labels, activeIndex, completedCount) => labels.map((label, index) => ({
  label,
  state: index < completedCount ? 'complete' : index === activeIndex ? 'active' : 'pending',
}));

export function getSupportWorkflow(ticket) {
  const labels = ['Evaluación técnica', 'Autorización administrativa', 'Ejecución y cierre'];
  const terminal = ['RESUELTO', 'CERRADO'].includes(ticket?.status);
  if (terminal) return { current: 2, complete: true, stages: buildStages(labels, 2, 3) };
  if (ticket?.proposalStatus === 'APROBADA') return { current: 2, complete: false, stages: buildStages(labels, 2, 2) };
  if (ticket?.proposalStatus === 'PENDIENTE') return { current: 1, complete: false, stages: buildStages(labels, 1, 1) };
  return { current: 0, complete: false, stages: buildStages(labels, 0, 0) };
}

export function getChangeWorkflow(change) {
  const labels = ['Evaluación y planificación', 'Autorización', 'Ejecución y PIR'];
  if (change?.status === 'CERRADO') return { current: 2, complete: true, stages: buildStages(labels, 2, 3) };
  if (['APROBADO', 'OBSERVADO', 'EN_VALIDACION'].includes(change?.status)) {
    return { current: 2, complete: false, stages: buildStages(labels, 2, 2) };
  }
  if (change?.status === 'PENDIENTE_APROBACION') {
    return { current: 1, complete: false, stages: buildStages(labels, 1, 1) };
  }
  return { current: 0, complete: false, stages: buildStages(labels, 0, 0) };
}

export function formatTechnicalDate(value) {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}
