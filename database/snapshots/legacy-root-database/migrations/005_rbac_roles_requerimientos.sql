-- =============================================================================
-- MIGRACIÓN 005: Nuevos Roles RBAC y Módulo de Requerimientos de Personal
-- Destino: gtel_talento y gtel_talento_mejoras
-- =============================================================================

-- 1. Asegurar la existencia de los nuevos roles RBAC
INSERT INTO roles (id, nombre, descripcion) VALUES
  (4, 'JEFATURA_SOLICITANTE', 'Jefatura o líder de área solicitante de personal'),
  (5, 'ANALISTA_RRHH', 'Analista de recursos humanos para filtrado y coordinación'),
  (6, 'ENTREVISTADOR', 'Evaluador técnico y conductor de entrevistas asignadas')
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);

-- 2. Cuentas de usuario de prueba para los nuevos roles
INSERT INTO usuarios (id, email, password_hash, auth_version, otp_exempt, rol_id, estado, created_at) VALUES
  (4, 'jefatura1@gmail.com', '$2a$10$05zqAdPTwtKhlABiE4IJW.wcMlKwX9jXULfTbaRx.Bx5DwGMaspBe', 0, 1, 4, 'activo', NOW()),
  (5, 'analista1@gmail.com', '$2a$10$05zqAdPTwtKhlABiE4IJW.wcMlKwX9jXULfTbaRx.Bx5DwGMaspBe', 0, 1, 5, 'activo', NOW()),
  (6, 'entrevistador1@gmail.com', '$2a$10$05zqAdPTwtKhlABiE4IJW.wcMlKwX9jXULfTbaRx.Bx5DwGMaspBe', 0, 1, 6, 'activo', NOW())
ON DUPLICATE KEY UPDATE rol_id = VALUES(rol_id), estado = 'activo', otp_exempt = 1;

-- 3. Semillero de Requerimientos de Personal
INSERT INTO requerimientos_personal (
  id, departamento_id, solicitante_id, titulo, descripcion, cantidad, estado,
  fecha_solicitud, fecha_aprobacion, observaciones
) VALUES
(
  1,
  3,
  4,
  'Ingeniero de Redes y Conectividad N2',
  'Se requiere ampliar el equipo técnico para atención de clientes corporativos de fibra óptica con guardias rotativas.',
  2,
  'aprobado',
  DATE_SUB(NOW(), INTERVAL 6 DAY),
  DATE_SUB(NOW(), INTERVAL 2 DAY),
  'Aprobado por Gerencia de RRHH para apertura inmediata de vacante.'
),
(
  2,
  3,
  4,
  'Desarrollador Backend Java Spring',
  'Incorporación de desarrollador para modernización de servicios internos e integraciones API de telecomunicaciones.',
  1,
  'pendiente',
  DATE_SUB(NOW(), INTERVAL 1 DAY),
  NULL,
  'En revisión de presupuesto de TI para el último trimestre.'
),
(
  3,
  1,
  4,
  'Asesor Comercial Corporativo B2B',
  'Apertura de nueva cartera de cuentas empresariales en Lima Metropolitana.',
  3,
  'rechazado',
  DATE_SUB(NOW(), INTERVAL 10 DAY),
  NULL,
  'Se priorizarán contrataciones outbound masivas antes de cuentas corporativas grandes.'
)
ON DUPLICATE KEY UPDATE
  titulo = VALUES(titulo),
  descripcion = VALUES(descripcion),
  estado = VALUES(estado),
  observaciones = VALUES(observaciones);
