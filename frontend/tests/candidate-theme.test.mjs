import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const pagePath = path.join(testsDir, '../src/pages/candidato/MisPostulacionesPage.jsx');

test('Vista candidato administrativa: postulaciones hereda el tema activo', () => {
  const applications = fs.readFileSync(pagePath, 'utf8');

  for (const className of ['bg-app-bg', 'bg-app-surface', 'text-app-primary', 'text-app-secondary', 'border-app-border', 'bg-app-action']) {
    assert.ok(applications.includes(className), `Mis postulaciones debe utilizar ${className}`);
  }
  for (const fixedLightClass of ['min-h-screen bg-[#F8FAFC]', 'className="bg-white rounded-xl', 'border border-gray-100', 'text-[#1E293B]', 'text-[#475569]']) {
    assert.ok(!applications.includes(fixedLightClass), `Mis postulaciones no debe conservar el estilo claro fijo ${fixedLightClass}`);
  }

  assert.ok(applications.includes('getCandidateApplications(user)'), 'La corrección visual debe conservar la consulta de postulaciones');
  assert.ok(applications.includes('to={`/ofertas/${app.jobId}`}'), 'La corrección visual debe conservar el acceso a la oferta');
  assert.ok(applications.includes('contactar-reclutador?oferta='), 'La corrección visual debe conservar el contacto con reclutamiento');
});
