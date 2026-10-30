-- ============================================================================
-- MIGRACIÓN 007: NOTIFICACIONES EN TIEMPO REAL Y CENTRO DE NOTIFICACIONES
-- ATS GTEL TALENTO
-- ============================================================================

CREATE TABLE IF NOT EXISTS notificaciones (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id BIGINT NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  mensaje TEXT NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  enlace VARCHAR(255) NULL,
  leida TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notificaciones_usuario (usuario_id),
  INDEX idx_notificaciones_leida (leida),
  INDEX idx_notificaciones_tipo (tipo),
  INDEX idx_notificaciones_created_at (created_at),
  CONSTRAINT fk_notificaciones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Semillas iniciales para cuentas de prueba activas
INSERT INTO notificaciones (usuario_id, titulo, mensaje, tipo, enlace, leida, created_at)
VALUES 
  -- Reclutador (ID 3 - reclutador1@gmail.com)
  (3, 'Nueva postulación recibida', 'Carlos Mendoza se ha postulado a la vacante "Ingeniero de Redes y Telecomunicaciones".', 'POSTULACION_NUEVA', '/reclutador/postulantes', 0, NOW() - INTERVAL 1 HOUR),
  (3, 'Nueva postulación recibida', 'Ana Torres se ha postulado a la vacante "Desarrollador Full Stack Senior".', 'POSTULACION_NUEVA', '/reclutador/postulantes', 0, NOW() - INTERVAL 3 HOUR),
  (3, 'Requerimiento de personal', 'Jefatura Solicitante ha creado una nueva solicitud de puesto: "Especialista en Fibra Óptica FTTH".', 'REQUERIMIENTO_ESTADO', '/reclutador/requerimientos', 1, NOW() - INTERVAL 1 DAY),
  
  -- Jefatura Solicitante (ID 4 - jefatura1@gmail.com)
  (4, 'Requerimiento en proceso', 'Tu requerimiento para "Especialista en Fibra Óptica FTTH" ha sido asignado al equipo de RRHH.', 'REQUERIMIENTO_ESTADO', '/reclutador/requerimientos', 0, NOW() - INTERVAL 2 HOUR),
  
  -- Analista RRHH (ID 5 - analista1@gmail.com)
  (5, 'Revisión de candidatos', 'Tienes nuevas postulaciones pendientes de validación inicial en la bandeja de entrada.', 'POSTULACION_NUEVA', '/reclutador/postulantes', 0, NOW() - INTERVAL 4 HOUR),
  
  -- Entrevistador (ID 6 - entrevistador1@gmail.com)
  (6, 'Entrevista técnica asignada', 'Se te ha asignado la entrevista de evaluación técnica con el candidato Carlos Mendoza.', 'ENTREVISTA_PROGRAMADA', '/reclutador/entrevistas', 0, NOW() - INTERVAL 5 HOUR),
  
  -- Candidato (ID 2 - postulante1@gmail.com)
  (2, 'Postulación recibida con éxito', 'Tu postulación a la vacante "Ingeniero de Redes y Telecomunicaciones" fue registrada con código GTEL-2026-0001.', 'POSTULACION_REGISTRADA', '/mis-postulaciones', 0, NOW() - INTERVAL 6 HOUR),
  
  -- Administrador (ID 1 - administrador@gmail.com)
  (1, 'Auditoría del Sistema', 'Todos los servicios de seguridad, rate limiting y base de datos operan con normalidad.', 'SISTEMA', '/reclutador/dashboard', 1, NOW() - INTERVAL 12 HOUR);
