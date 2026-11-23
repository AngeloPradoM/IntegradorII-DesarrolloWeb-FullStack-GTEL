import assert from 'node:assert/strict';
import test from 'node:test';
import { getChangeWorkflow, getSupportWorkflow } from '../src/utils/technicalWorkflow.js';

test('Flujo técnico de solicitudes representa estados reales sin inventar transiciones', () => {
  assert.equal(getSupportWorkflow({ status: 'ASIGNADO', proposalStatus: 'SIN_PROPUESTA' }).current, 0);
  assert.equal(getSupportWorkflow({ status: 'EN_ESPERA', proposalStatus: 'PENDIENTE' }).current, 1);
  assert.equal(getSupportWorkflow({ status: 'ASIGNADO', proposalStatus: 'APROBADA' }).current, 2);
  assert.equal(getSupportWorkflow({ status: 'RESUELTO', proposalStatus: 'APROBADA' }).complete, true);
  assert.deepEqual(getSupportWorkflow({ status: 'EN_ESPERA', proposalStatus: 'PENDIENTE' }).stages.map(stage => stage.state), ['complete', 'active', 'pending']);
});

test('Flujo técnico RFC conserva evaluación, autorización, ejecución y cierre', () => {
  assert.equal(getChangeWorkflow({ status: 'AJUSTES_SOLICITADOS' }).current, 0);
  assert.equal(getChangeWorkflow({ status: 'PENDIENTE_APROBACION' }).current, 1);
  assert.equal(getChangeWorkflow({ status: 'APROBADO' }).current, 2);
  assert.equal(getChangeWorkflow({ status: 'EN_VALIDACION' }).current, 2);
  assert.equal(getChangeWorkflow({ status: 'CERRADO' }).complete, true);
  assert.deepEqual(getChangeWorkflow({ status: 'APROBADO' }).stages.map(stage => stage.state), ['complete', 'complete', 'active']);
});
