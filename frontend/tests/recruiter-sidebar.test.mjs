import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.join(testsDir, '..');
const layout = fs.readFileSync(path.join(frontendDir, 'src/layouts/RecruiterLayout.jsx'), 'utf8');
const sidebarCss = fs.readFileSync(path.join(frontendDir, 'src/layouts/recruiter-sidebar.css'), 'utf8');

test('Sidebar reclutador: ubicación deriva de las rutas existentes', () => {
  for (const context of [
    'Panel principal', 'Reclutamiento', 'Candidatos', 'Seguimiento', 'Asistencia',
    'Dashboard', 'Requerimientos', 'Ofertas', 'Publicar oferta', 'Papelera',
    'Postulantes', 'Selección', 'Entrevistas', 'Evaluaciones', 'Mesa de ayuda y cambios', 'Guía de uso',
  ]) {
    assert.ok(layout.includes(context), `Debe existir el contexto ${context}`);
  }
  assert.ok(layout.includes('getRouteContext(location.pathname)'), 'La ubicación debe derivarse del router');
  assert.ok(layout.includes('key={location.pathname}'), 'El indicador debe actualizarse al cambiar la ruta');
  assert.ok(layout.includes('aria-live="polite"'), 'El cambio de ubicación debe anunciarse de forma discreta');
});

test('Sidebar reclutador: microanimaciones accesibles y colapsado informativo', () => {
  assert.ok(layout.includes('aria-current={active ? "page" : undefined}'), 'La opción activa debe conservar aria-current');
  assert.ok(layout.includes('aria-label={collapsed ? label : undefined}'), 'Los enlaces contraídos deben conservar nombre accesible');
  assert.ok(layout.includes('title={collapsed ? label : undefined}'), 'Los enlaces contraídos deben ofrecer tooltip');
  assert.ok(sidebarCss.includes('translateX(3px)'), 'El desplazamiento de hover no debe superar 3 px');
  assert.ok(sidebarCss.includes('scale(.99)'), 'La presión debe respetar la escala máxima solicitada');
  assert.ok(sidebarCss.includes('@media (prefers-reduced-motion: reduce)'), 'Las animaciones deben respetar movimiento reducido');
  assert.ok(sidebarCss.includes('var(--color-app-action)'), 'El indicador debe reutilizar la paleta oficial');
  assert.ok(layout.includes('getNavigationGroup(path)'), 'Las opciones deben conservar una agrupación visual derivada de sus rutas');
  assert.ok(layout.includes('bg-app-surface text-app-primary'), 'El sidebar debe responder al tema claro y oscuro');
  assert.ok(sidebarCss.includes('.recruiter-nav-group-label'), 'Las agrupaciones deben mantener un estilo discreto');
});
