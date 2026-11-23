import assert from 'node:assert/strict';
import test from 'node:test';
import {
  displayStatusOf, formatIncidentDate, incidentDisplayStatusLabels, incidentDisplayStatusTone,
  localDateTimeValue,
  technicalIncidentTransitions,
} from '../src/utils/incidentUi.js';

test('deriva los seis estados visibles sin reemplazar el estado interno', () => {
  assert.equal(displayStatusOf({ status: 'REGISTRADO' }), 'NUEVO');
  assert.equal(displayStatusOf({ status: 'EN_INVESTIGACION' }), 'EN_DIAGNOSTICO');
  assert.equal(displayStatusOf({ status: 'EN_MITIGACION' }), 'EN_ATENCION');
  assert.equal(displayStatusOf({ status: 'SERVICIO_RECUPERADO' }), 'RESUELTO');
  assert.equal(displayStatusOf({ status: 'CERRADO', activeEscalation: true }), 'CERRADO');
  assert.equal(displayStatusOf({ status: 'EN_INVESTIGACION', activeEscalation: true }), 'ESCALADO');
  assert.deepEqual(Object.keys(incidentDisplayStatusLabels), ['NUEVO','EN_DIAGNOSTICO','EN_ATENCION','ESCALADO','RESUELTO','CERRADO']);
});

test('conserva transiciones técnicas y tonos compatibles con modo oscuro', () => {
  assert.deepEqual(technicalIncidentTransitions.ASIGNADO, [['EN_INVESTIGACION', 'Iniciar investigación']]);
  for (const tone of Object.values(incidentDisplayStatusTone)) assert.match(tone, /dark:|bg-app-muted/);
});

test('interpreta fechas sin zona como hora Lima y genera datetime-local en Lima', () => {
  assert.equal(localDateTimeValue(new Date('2026-11-22T04:11:00Z')), '2026-11-21T23:11');
  const formatted = formatIncidentDate('2026-11-21T23:11:00');
  assert.match(formatted, /11:11\s*p\.\s*m\./i);
});
