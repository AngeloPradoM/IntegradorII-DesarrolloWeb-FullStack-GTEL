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
  define: { 'import.meta.env.VITE_DATA_MODE': '"demo"' }
});

const originalFetch = globalThis.fetch;
globalThis.localStorage = { getItem() { return null; } };

try {
  const {
    getPrivacyPolicyInfo,
    exportCandidateArcoData,
    anonymizeCandidateArcoAccount
  } = await server.ssrLoadModule('/src/services/api.js');

  // Test 1: Policy Info
  const policy = await getPrivacyPolicyInfo();
  assert.ok(policy.ley.includes('29733'));
  assert.ok(policy.derechosArco.includes('Acceso'));
  assert.ok(policy.derechosArco.includes('Cancelación'));

  // Test 2: Export requires session and handles 429
  await assert.rejects(exportCandidateArcoData(null), /Inicia sesión/);

  const mockUser = { token: 'mock-candidate-token', email: 'candidato@gtel.pe' };

  globalThis.fetch = async () => new Response(JSON.stringify({ message: 'Demasiadas solicitudes' }), {
    status: 429,
    headers: { 'Retry-After': '45', 'Content-Type': 'application/json' }
  });

  await assert.rejects(
    exportCandidateArcoData(mockUser),
    /Demasiadas solicitudes/
  );

  // Test 3: Export success
  globalThis.fetch = async (url, options) => {
    assert.ok(url.includes('/api/candidate/privacy/export'));
    assert.equal(options.headers.Authorization, 'Bearer mock-candidate-token');
    return new Response(JSON.stringify({
      baseLegal: 'Ley N° 29733',
      titular: { nombres: 'Carlos', dni: '76543210' },
      postulaciones: [{ codigo: 'GTEL-2026-001' }]
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  const exported = await exportCandidateArcoData(mockUser);
  assert.equal(exported.titular.nombres, 'Carlos');
  assert.equal(exported.postulaciones[0].codigo, 'GTEL-2026-001');

  // Test 4: Anonymization success
  globalThis.fetch = async (url, options) => {
    assert.ok(url.includes('/api/candidate/privacy/anonymize'));
    const body = JSON.parse(options.body);
    assert.equal(body.confirmacion, true);
    assert.equal(body.motivo, 'Fin de proceso');
    return new Response(JSON.stringify({
      exito: true,
      mensaje: 'Cuenta anonimizada conforme a Ley 29733',
      baseLegal: 'Ley N° 29733'
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  const result = await anonymizeCandidateArcoAccount(true, 'Fin de proceso', mockUser);
  assert.equal(result.exito, true);
  assert.ok(result.mensaje.includes('29733'));

  console.log('PASS privacy-arco: Ley 29733, derechos ARCO de exportación y anonimización, y manejo de Rate Limiting 429.');
} finally {
  globalThis.fetch = originalFetch;
  await server.close();
}
