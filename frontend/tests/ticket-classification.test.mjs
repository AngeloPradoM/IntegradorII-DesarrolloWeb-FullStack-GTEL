import assert from 'node:assert/strict';
import test from 'node:test';
import {
  classifyRecruiterTicket,
  evaluateRisk,
  parseTicketEvaluation,
  probabilityFromFrequency,
  RISK_MATRIX,
} from '../src/utils/ticketClassification.js';

test('conserva completa la matriz de probabilidad por impacto', () => {
  assert.deepEqual(RISK_MATRIX, {
    ALTA: { BAJO: 'MEDIO', MEDIO: 'ALTO', ALTO: 'ALTO' },
    MEDIA: { BAJO: 'BAJO', MEDIO: 'MEDIO', ALTO: 'ALTO' },
    BAJA: { BAJO: 'BAJO', MEDIO: 'BAJO', ALTO: 'MEDIO' },
  });
  assert.equal(evaluateRisk('BAJA', 'ALTO'), 'MEDIO');
  assert.equal(evaluateRisk('ALTA', 'MEDIO'), 'ALTO');
});

test('no inventa probabilidad cuando solo se reporta la primera ocurrencia', () => {
  assert.equal(probabilityFromFrequency('PRIMERA_VEZ'), null);
  const result = classifyRecruiterTicket({
    scope: 'UN_USUARIO', impact: 'MEDIO', urgency: 'MEDIA', blocksWork: 'NO', frequency: 'PRIMERA_VEZ',
  });
  assert.equal(result.priority, 'MEDIA');
  assert.equal(result.probability, null);
  assert.equal(result.risk, null);
  assert.match(result.explanation, /Probabilidad: Pendiente de evaluación/);
});

test('sugiere prioridad alta por alcance múltiple y calcula riesgo solo con recurrencia', () => {
  const result = classifyRecruiterTicket({
    scope: 'VARIOS_USUARIOS', impact: 'ALTO', urgency: 'ALTA', blocksWork: 'SI', frequency: 'RECURRENTE',
  });
  assert.equal(result.priority, 'ALTA');
  assert.equal(result.probability, 'ALTA');
  assert.equal(result.risk, 'ALTO');
  assert.ok(result.explanation.length <= 1000);
});

test('mantiene baja una afectación menor, individual y no bloqueante', () => {
  const result = classifyRecruiterTicket({
    scope: 'UN_USUARIO', impact: 'BAJO', urgency: 'BAJA', blocksWork: 'NO', frequency: 'INTERMITENTE',
  });
  assert.equal(result.priority, 'BAJA');
  assert.equal(result.probability, 'MEDIA');
  assert.equal(result.risk, 'BAJO');
});

test('no clasifica mientras falten datos objetivos', () => {
  const result = classifyRecruiterTicket({ scope: '', impact: '', urgency: '', blocksWork: '', frequency: '' });
  assert.equal(result.priority, null);
  assert.match(result.explanation, /Completa alcance/);
});

test('recupera la evaluación persistida sin recalcular ni alterar valores', () => {
  const stored = classifyRecruiterTicket({
    scope: 'VARIOS_USUARIOS', impact: 'ALTO', urgency: 'ALTA', blocksWork: 'SI', frequency: 'RECURRENTE',
  });
  const evaluation = parseTicketEvaluation(stored.explanation);
  assert.equal(evaluation.automatic, true);
  assert.equal(evaluation.scope, 'Varios usuarios');
  assert.equal(evaluation.probability, 'Alta');
  assert.equal(evaluation.risk, 'Alto');
  assert.equal(evaluation.suggestedPriority, 'Alta');
});

test('conserva tickets anteriores sin inventar una evaluación estructurada', () => {
  const evaluation = parseTicketEvaluation('Prioridad indicada manualmente por el solicitante.');
  assert.deepEqual(evaluation, {
    automatic: false,
    justification: 'Prioridad indicada manualmente por el solicitante.',
  });
});
