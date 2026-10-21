import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  envDir: false,
  server: { middlewareMode: true }
});

try {
  const { getPublicJobs, getPublicJob, getPublicDepartments } = await server.ssrLoadModule('/src/services/jobService.js');

  // Simular fetch global para probar contratos
  const originalFetch = globalThis.fetch;

  // 1. Probar construcción de parámetros en getPublicJobs
  let requestedUrl = '';
  globalThis.fetch = async (url) => {
    requestedUrl = String(url);
    return {
      ok: true,
      status: 200,
      json: async () => [
        { id: 1, title: 'Asesor Comercial', location: 'Lima, Perú', salary: 'S/ 1,500 - S/ 2,200', type: 'Full-Time' }
      ]
    };
  };

  const jobs = await getPublicJobs({ search: 'Ventas', type: 'Full-Time', location: 'Lima' });
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].title, 'Asesor Comercial');
  assert.ok(requestedUrl.includes('search=Ventas'));
  assert.ok(requestedUrl.includes('type=Full-Time'));
  assert.ok(requestedUrl.includes('location=Lima'));

  // 2. Probar getPublicJob con 404 retorna null
  globalThis.fetch = async () => ({
    ok: false,
    status: 404,
    json: async () => ({ message: 'Not Found' })
  });

  const missing = await getPublicJob(999);
  assert.equal(missing, null);

  // 3. Probar getPublicDepartments
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => [
      { id: 1, name: 'Ventas y Comercial' },
      { id: 2, name: 'Atención al Cliente' }
    ]
  });

  const depts = await getPublicDepartments();
  assert.equal(depts.length, 2);
  assert.equal(depts[0].name, 'Ventas y Comercial');

  // Restaurar fetch original
  globalThis.fetch = originalFetch;
  console.log('PASS jobService: parameter construction, 404 handling, and department listing.');
} finally {
  await server.close();
}
