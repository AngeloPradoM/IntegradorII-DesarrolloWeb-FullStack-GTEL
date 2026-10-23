import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'vite';

const server = await createServer({
  cacheDir: join(tmpdir(), 'gtel-vite-' + randomUUID()),
  optimizeDeps: { noDiscovery: true, include: [] },
  configFile: false,
  envDir: false,
  server: { middlewareMode: true, hmr: false },
});
const originalFetch = globalThis.fetch;
globalThis.localStorage = {
  getItem: key => key === 'gtel-user' ? JSON.stringify({ token: 'ticket-test-token', rol: 'TECNICO' }) : null,
  setItem() {},
  removeItem() {},
};

try {
  const api = await server.ssrLoadModule('/src/services/supportService.js');
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    return { ok: true, status: 200, json: async () => ({ id: 12, code: 'SR-000012' }) };
  };

  await api.listSupportTickets();
  await api.listTechnicians();
  await api.createSupportTicket({ title: 'Incidencia' });
  await api.assignSupportTicket(12, 7);
  await api.updateSupportTicketStatus(12, 'EN_ATENCION');
  await api.submitSupportProposal(12, 'Diagnóstico', 'Solución');
  await api.decideSupportProposal(12, true, 'Aprobado');
  await api.registerSupportExecution(12, 'Evidencia registrada');

  assert.deepEqual(calls.map(call => new URL(call.url).pathname), [
    '/api/support/tickets',
    '/api/support/technicians',
    '/api/support/tickets',
    '/api/support/tickets/12/assignment',
    '/api/support/tickets/12/status',
    '/api/support/tickets/12/proposal',
    '/api/support/tickets/12/decision',
    '/api/support/tickets/12/execution',
  ]);
  assert.deepEqual(calls.map(call => call.options.method || 'GET'), ['GET', 'GET', 'POST', 'PATCH', 'PATCH', 'PUT', 'PATCH', 'PUT']);
  assert.ok(calls.every(call => call.options.headers.Authorization === 'Bearer ticket-test-token'));
  assert.deepEqual(JSON.parse(calls[3].options.body), { technicianId: 7 });
  assert.deepEqual(JSON.parse(calls[5].options.body), { diagnosis: 'Diagnóstico', proposedSolution: 'Solución' });
  assert.deepEqual(JSON.parse(calls[6].options.body), { approved: true, comment: 'Aprobado' });
  assert.deepEqual(JSON.parse(calls[7].options.body), { evidence: 'Evidencia registrada' });
  console.log('PASS supportService: authenticated ticket routes, methods and workflow payloads.');
} finally {
  globalThis.fetch = originalFetch;
  delete globalThis.localStorage;
  await server.close();
}