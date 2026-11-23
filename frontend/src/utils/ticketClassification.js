export const RISK_MATRIX = Object.freeze({
  ALTA: Object.freeze({ BAJO: 'MEDIO', MEDIO: 'ALTO', ALTO: 'ALTO' }),
  MEDIA: Object.freeze({ BAJO: 'BAJO', MEDIO: 'MEDIO', ALTO: 'ALTO' }),
  BAJA: Object.freeze({ BAJO: 'BAJO', MEDIO: 'BAJO', ALTO: 'MEDIO' }),
});

const labels = {
  scope: {
    UN_USUARIO: 'Un usuario',
    VARIOS_USUARIOS: 'Varios usuarios',
    SERVICIO_GENERAL: 'Servicio general',
  },
  level: { BAJA: 'Baja', MEDIA: 'Media', ALTA: 'Alta', BAJO: 'Bajo', MEDIO: 'Medio', ALTO: 'Alto' },
  urgency: { BAJA: 'Baja', MEDIA: 'Media', ALTA: 'Alta' },
  frequency: {
    PRIMERA_VEZ: 'Primera vez',
    INTERMITENTE: 'Intermitente',
    RECURRENTE: 'Recurrente',
  },
};

export function evaluateRisk(probability, impact) {
  return RISK_MATRIX[probability]?.[impact] ?? null;
}

export function probabilityFromFrequency(frequency) {
  if (frequency === 'RECURRENTE') return 'ALTA';
  if (frequency === 'INTERMITENTE') return 'MEDIA';
  return null;
}

export function classifyRecruiterTicket({ scope, impact, urgency, blocksWork, frequency }) {
  const complete = scope && impact && urgency && blocksWork !== '' && frequency;
  if (!complete) {
    return {
      priority: null,
      probability: null,
      risk: null,
      explanation: 'Completa alcance, impacto, urgencia, continuidad y frecuencia para obtener una prioridad sugerida.',
    };
  }

  const blocks = blocksWork === true || blocksWork === 'SI';
  let priority = 'BAJA';
  let rule = 'El problema es menor y permite continuar trabajando.';

  if (scope !== 'UN_USUARIO') {
    priority = 'ALTA';
    rule = 'Afecta a varios usuarios o al servicio general.';
  } else if (blocks && (impact !== 'BAJO' || urgency === 'ALTA')) {
    priority = 'ALTA';
    rule = 'Bloquea una operación de impacto relevante.';
  } else if (blocks || impact !== 'BAJO' || urgency !== 'BAJA') {
    priority = 'MEDIA';
    rule = 'Dificulta una operación importante, pero el alcance reportado es individual.';
  }

  const probability = probabilityFromFrequency(frequency);
  const risk = probability ? evaluateRisk(probability, impact) : null;
  const pending = 'Pendiente de evaluación (sin evidencia de recurrencia)';
  const explanation = [
    'Clasificación automática.',
    `Alcance: ${labels.scope[scope]}.`,
    `Impacto declarado: ${labels.level[impact]}.`,
    `Urgencia declarada: ${labels.urgency[urgency]}.`,
    `Continuidad: ${blocks ? 'Impide continuar' : 'Permite continuar'}.`,
    `Frecuencia: ${labels.frequency[frequency]}.`,
    `Probabilidad: ${probability ? labels.level[probability] : pending}.`,
    `Riesgo: ${risk ? labels.level[risk] : 'Pendiente de evaluación'}.`,
    `Prioridad sugerida: ${labels.level[priority]}.`,
    `Regla: ${rule}`,
  ].join(' ');

  return { priority, probability, risk, explanation };
}

const extractBetween = (value, start, end) => {
  const pattern = new RegExp(`${start}:\\s*(.*?)\\.\\s+${end}:`);
  return value.match(pattern)?.[1]?.trim() || null;
};

export function parseTicketEvaluation(priorityJustification) {
  const source = String(priorityJustification || '').trim();
  if (!source.startsWith('Clasificación automática.')) {
    return { automatic: false, justification: source || null };
  }

  return {
    automatic: true,
    scope: extractBetween(source, 'Alcance', 'Impacto declarado'),
    impact: extractBetween(source, 'Impacto declarado', 'Urgencia declarada'),
    urgency: extractBetween(source, 'Urgencia declarada', 'Continuidad'),
    continuity: extractBetween(source, 'Continuidad', 'Frecuencia'),
    frequency: extractBetween(source, 'Frecuencia', 'Probabilidad'),
    probability: extractBetween(source, 'Probabilidad', 'Riesgo'),
    risk: extractBetween(source, 'Riesgo', 'Prioridad sugerida'),
    suggestedPriority: extractBetween(source, 'Prioridad sugerida', 'Regla'),
    rule: source.match(/Regla:\s*(.+)$/)?.[1]?.trim() || null,
    justification: source,
  };
}
