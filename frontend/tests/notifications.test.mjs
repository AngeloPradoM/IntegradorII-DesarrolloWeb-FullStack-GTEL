import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { createServer } from 'vite';

const server = await createServer({
  cacheDir: join(tmpdir(), 'gtel-vite-' + randomUUID()),
  optimizeDeps: { noDiscovery: true, include: [] },
  configFile: false,
  envDir: false,
  server: { middlewareMode: true, hmr: false },
});

try {
  const adapters = await server.ssrLoadModule('/src/services/recruiterAdapters.js');
  const api = await server.ssrLoadModule('/src/services/recruiterService.js');
  const { recruiterTransport: transport } = await server.ssrLoadModule('/src/services/recruiterTransport.js');

  test('Notificaciones: Normalización con campos completos camelCase', () => {
    const raw = {
      id: 101,
      title: 'Nueva postulación recibida',
      description: 'Carlos Mendoza se postuló a Telecomunicaciones',
      type: 'POSTULACION_NUEVA',
      link: '/reclutador/postulantes',
      read: false,
      createdAt: '12/10/2026 15:30',
    };

    const normalized = adapters.normalizeNotification(raw);

    assert.equal(normalized.id, '101');
    assert.equal(normalized.title, 'Nueva postulación recibida');
    assert.equal(normalized.description, 'Carlos Mendoza se postuló a Telecomunicaciones');
    assert.equal(normalized.type, 'POSTULACION_NUEVA');
    assert.equal(normalized.link, '/reclutador/postulantes');
    assert.equal(normalized.read, false);
    assert.equal(normalized.createdAt, '12/10/2026 15:30');
  });

  test('Notificaciones: Normalización con campos en español y snake_case', () => {
    const raw = {
      id: 202,
      titulo: 'Entrevista programada',
      mensaje: 'Entrevista técnica a las 10:00 AM',
      tipo: 'ENTREVISTA_PROGRAMADA',
      enlace: '/mis-postulaciones',
      leida: 1,
      created_at: '12/10/2026 10:00',
    };

    const normalized = adapters.normalizeNotification(raw);

    assert.equal(normalized.id, '202');
    assert.equal(normalized.title, 'Entrevista programada');
    assert.equal(normalized.description, 'Entrevista técnica a las 10:00 AM');
    assert.equal(normalized.type, 'ENTREVISTA_PROGRAMADA');
    assert.equal(normalized.link, '/mis-postulaciones');
    assert.equal(normalized.read, true);
    assert.equal(normalized.createdAt, '12/10/2026 10:00');
  });

  test('Notificaciones: Normalización tolerante a campos nulos o ausentes', () => {
    const raw = { id: 303 };
    const normalized = adapters.normalizeNotification(raw);

    assert.equal(normalized.id, '303');
    assert.equal(normalized.title, 'Notificación');
    assert.equal(normalized.description, '');
    assert.equal(normalized.type, 'SISTEMA');
    assert.equal(normalized.read, false);
  });

  test('Notificaciones: Conteo de no leídas delega a unreadNotificationCount en transport', async () => {
    transport.unreadNotificationCount = async () => ({ unreadCount: 7 });

    const count = await api.getNotificationUnreadCount();
    assert.equal(count, 7);
  });

  test('Notificaciones: Marcado individual y masivo delegan correctamente', async () => {
    let markedId = null;
    let markedAll = false;

    transport.markNotificationRead = async ({ id }) => {
      markedId = id;
      return null;
    };
    transport.markAllNotificationsRead = async () => {
      markedAll = true;
      return null;
    };

    await api.markRecruiterNotificationRead(45);
    assert.equal(markedId, 45);

    await api.markAllRecruiterNotificationsRead();
    assert.equal(markedAll, true);
  });
} finally {
  await server.close();
}
