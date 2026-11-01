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
  getItem: key => key === 'gtel-user' ? JSON.stringify({ token: 'change-test-token', rol: 'ADMIN' }) : null,
  setItem() {},
  removeItem() {},
};

try {
  const api = await server.ssrLoadModule('/src/services/changeManagementService.js');
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    return { ok: true, status: 200, json: async () => ({ id: 4, code: 'RFC-2026-0004' }) };
  };

  await api.listChangeRequests();
  await api.createChangeRequest({ title: 'Actualizar servidor' }, new Blob(['docx']));
  await api.assignChangeRequest(4, 7);
  await api.submitChangeTechnicalReview(4, { testPlan: 'Pruebas' });
  await api.decideChangeRequest(4, { approved: true });
  await api.registerChangeExecution(4, { result: 'EXITOSO' });
  await api.validateChangeExecution(4, { accepted: true, comment: '' });

  assert.deepEqual(calls.map(call => new URL(call.url).pathname), [
    '/api/change-management/requests',
    '/api/change-management/requests',
    '/api/change-management/requests/4/assignment',
    '/api/change-management/requests/4/technical-review',
    '/api/change-management/requests/4/decision',
    '/api/change-management/requests/4/execution',
    '/api/change-management/requests/4/validation',
  ]);
  assert.deepEqual(calls.map(call => call.options.method || 'GET'), ['GET', 'POST', 'PATCH', 'PUT', 'PATCH', 'PUT', 'PATCH']);
  assert.ok(calls.every(call => call.options.headers.Authorization === 'Bearer change-test-token'));
  assert.ok(calls[1].options.body instanceof FormData);
  assert.deepEqual(JSON.parse(calls[2].options.body), { technicianId: 7 });
  assert.deepEqual(JSON.parse(calls[6].options.body), { accepted: true, comment: '' });
  console.log('PASS changeManagementService: multipart RFC and authenticated workflow routes.');
} finally {
  globalThis.fetch = originalFetch;
  delete globalThis.localStorage;
  await server.close();
}
