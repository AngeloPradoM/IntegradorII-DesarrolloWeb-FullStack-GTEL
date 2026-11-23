import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'vite';

const server = await createServer({ cacheDir: join(tmpdir(), 'gtel-vite-' + randomUUID()), optimizeDeps: { noDiscovery: true, include: [] }, configFile: false, envDir: false, server: { middlewareMode: true, hmr: false } });
const originalFetch = globalThis.fetch;
globalThis.localStorage = { getItem: key => key === 'gtel-user' ? JSON.stringify({ token: 'incident-token', rol: 'ADMIN' }) : null, setItem() {}, removeItem() {} };

try {
  const api = await server.ssrLoadModule('/src/services/incidentService.js');
  const calls = [];
  const reportBlob = new Blob(['xlsx'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  globalThis.fetch = async (url, options = {}) => { calls.push({ url: String(url), options }); return { ok: true, status: 200, json: async () => ({ incident: { id: 9, version: 3 } }), blob: async () => reportBlob }; };
  await api.listProductionIncidents();
  await api.listProductionIncidentControl();
  await api.listMyReportedProductionIncidents();
  await api.getProductionIncidentConfiguration();
  const filters = { query: 'api', status: 'ESCALADO', priority: 'P1', categoryCode: 'DISPONIBILIDAD_PLATAFORMA', responsibleId: '7', fromDate: '2026-11-01', toDate: '2026-11-30' };
  await api.getProductionIncidentIndicators(filters);
  assert.equal(await api.exportProductionIncidentReport(filters), reportBlob);
  const createUrlDescriptor = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
  const revokeUrlDescriptor = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
  const originalTimeout = globalThis.setTimeout;
  let clicked = false, appended = false, removed = false, revoked = false;
  const anchor = { href: '', download: '', rel: '', click(){clicked=true;}, remove(){removed=true;} };
  globalThis.document = { createElement: tag => { assert.equal(tag,'a'); return anchor; }, body: { appendChild: node => { assert.equal(node,anchor); appended=true; } } };
  Object.defineProperty(URL,'createObjectURL',{configurable:true,value:blob=>{assert.equal(blob,reportBlob);return 'blob:incident-report';}});
  Object.defineProperty(URL,'revokeObjectURL',{configurable:true,value:url=>{assert.equal(url,'blob:incident-report');revoked=true;}});
  globalThis.setTimeout = callback => { callback(); return 1; };
  api.saveProductionIncidentWorkbook(reportBlob);
  assert.ok(clicked&&appended&&removed&&revoked);
  assert.match(anchor.download,/^incidentes-produccion-\d{4}-\d{2}-\d{2}\.xlsx$/);
  if(createUrlDescriptor)Object.defineProperty(URL,'createObjectURL',createUrlDescriptor);else delete URL.createObjectURL;
  if(revokeUrlDescriptor)Object.defineProperty(URL,'revokeObjectURL',revokeUrlDescriptor);else delete URL.revokeObjectURL;
  globalThis.setTimeout=originalTimeout;
  delete globalThis.document;
  await api.getProductionIncident(9);
  await api.createProductionIncident({ title: 'Caída', moduleCode: 'AVAILABILITY', serviceBlocked: true });
  await api.classifyProductionIncident(9, { priority: 'P1', reason: 'Impacto general', categoryCode: 'DISPONIBILIDAD_PLATAFORMA', categoryReason: '', expectedVersion: 3 });
  await api.assignProductionIncident(9, { technicianId: 7, expectedVersion: 4 });
  await api.addProductionIncidentActivity(9, { type: 'DIAGNOSTICO', detail: 'Revisión' });
  await api.updateProductionIncidentResolution(9, { solutionApplied: 'Reinicio', rootCause: 'Bloqueo', learning: 'Alerta', expectedVersion: 5 });
  await api.escalateProductionIncident(9, { destinationUserId: null, reason: 'Infraestructura', expectedVersion: 6 });
  await api.resolveProductionIncidentEscalation(9, 3, { resolution: 'Capacidad habilitada', expectedVersion: 7 });
  await api.transitionProductionIncident(9, { status: 'EN_INVESTIGACION', detail: 'Inicio', expectedVersion: 5 });
  await api.linkProductionIncidentTicket(9, 12, 'ORIGEN');
  await api.unlinkProductionIncidentTicket(9, 12);
  await api.linkProductionIncidentChange(9, 4, 'CORRECCION');
  await api.unlinkProductionIncidentChange(9, 4);

  const merged = api.mergeProductionIncidentControl(
    [{ id: 9, reporterEmail: 'reporter@gtel.test', reportChannel: null }],
    [{ id: 9, reporter: 'reporter@gtel.test', reportChannel: 'WEB', registeredById: 22,
      registeredByEmail: 'tech@gtel.test', attentionHours: 1.25, overdue: false }],
  );
  assert.equal(merged[0].reportChannel, 'WEB');
  assert.equal(merged[0].registeredByEmail, 'tech@gtel.test');
  assert.equal(merged[0].attentionHours, 1.25);

  assert.deepEqual(calls.map(call => new URL(call.url).pathname), [
    '/api/production-incidents','/api/production-incidents/control','/api/production-incidents/reported-by-me','/api/production-incidents/configuration','/api/production-incidents/indicators','/api/production-incidents/export',
    '/api/production-incidents/9','/api/production-incidents',
    '/api/production-incidents/9/classification','/api/production-incidents/9/assignment',
    '/api/production-incidents/9/activities','/api/production-incidents/9/resolution',
    '/api/production-incidents/9/escalations','/api/production-incidents/9/escalations/3/resolve',
    '/api/production-incidents/9/status','/api/production-incidents/9/tickets/12',
    '/api/production-incidents/9/tickets/12','/api/production-incidents/9/changes/4',
    '/api/production-incidents/9/changes/4',
  ]);
  assert.deepEqual(calls.map(call => call.options.method || 'GET'), ['GET','GET','GET','GET','GET','GET','GET','POST','PATCH','PATCH','POST','PATCH','POST','PATCH','PATCH','POST','DELETE','POST','DELETE']);
  assert.ok(calls.every(call => call.options.headers.Authorization === 'Bearer incident-token'));
  for (const index of [4,5]) assert.deepEqual(Object.fromEntries(new URL(calls[index].url).searchParams), filters);
  assert.deepEqual(JSON.parse(calls[8].options.body), { priority: 'P1', reason: 'Impacto general', categoryCode: 'DISPONIBILIDAD_PLATAFORMA', categoryReason: '', expectedVersion: 3 });
  assert.deepEqual(JSON.parse(calls[15].options.body), { relationship: 'ORIGEN' });
  assert.deepEqual(JSON.parse(calls[17].options.body), { purpose: 'CORRECCION' });
  console.log('PASS incidentService: authenticated Phase 5 indicators and export contract.');
} finally {
  globalThis.fetch = originalFetch;
  delete globalThis.localStorage;
  delete globalThis.document;
  await server.close();
}
