-- Ciclo de vida y retencion de la Mesa de Ayuda GTEL.
-- Ejecutar despues de 007_support_tickets.sql y 008_notification_schema_compatibility.sql.
-- La aplicacion archiva y elimina semanalmente los tickets terminales con al menos 7 dias.
USE gtel_talento;

CREATE TABLE IF NOT EXISTS ticket_soporte_estados (
  codigo VARCHAR(30) PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL,
  orden SMALLINT NOT NULL UNIQUE,
  terminal BOOLEAN NOT NULL DEFAULT FALSE,
  descripcion VARCHAR(255) NOT NULL
);

INSERT INTO ticket_soporte_estados (codigo, nombre, orden, terminal, descripcion) VALUES
  ('NUEVO', 'Nuevo', 10, FALSE, 'Solicitud registrada y pendiente de asignacion.'),
  ('ASIGNADO', 'Asignado', 20, FALSE, 'Solicitud asignada a un tecnico responsable.'),
  ('EN_ATENCION', 'En atencion', 30, FALSE, 'El tecnico esta ejecutando la atencion autorizada.'),
  ('EN_ESPERA', 'En espera', 40, FALSE, 'El caso espera informacion o autorizacion administrativa.'),
  ('RESUELTO', 'Resuelto', 50, TRUE, 'La solucion fue ejecutada y registrada con evidencia.'),
  ('CERRADO', 'Cerrado', 60, TRUE, 'El caso fue cerrado definitivamente.')
ON DUPLICATE KEY UPDATE
  nombre = VALUES(nombre),
  orden = VALUES(orden),
  terminal = VALUES(terminal),
  descripcion = VALUES(descripcion);

-- VARCHAR permite relacionar el estado con su catalogo; los valores siguen restringidos por FK.
ALTER TABLE tickets_soporte
  MODIFY estado VARCHAR(30) NOT NULL DEFAULT 'NUEVO';

UPDATE tickets_soporte
SET resolved_at = COALESCE(resolved_at, updated_at, created_at)
WHERE estado IN ('RESUELTO', 'CERRADO')
  AND resolved_at IS NULL;

SET @schema_name = DATABASE();

SET @sql = IF(
  EXISTS (
    SELECT 1
    FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CAST(CONSTRAINT_SCHEMA AS BINARY) = CAST(@schema_name AS BINARY)
      AND CAST(CONSTRAINT_NAME AS BINARY) = CAST('fk_ticket_estado_catalogo' AS BINARY)
  ),
  'SELECT 1',
  'ALTER TABLE tickets_soporte ADD CONSTRAINT fk_ticket_estado_catalogo FOREIGN KEY (estado) REFERENCES ticket_soporte_estados(codigo)'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  EXISTS (
    SELECT 1
    FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CAST(CONSTRAINT_SCHEMA AS BINARY) = CAST(@schema_name AS BINARY)
      AND CAST(CONSTRAINT_NAME AS BINARY) = CAST('fk_ticket_historial_estado_anterior' AS BINARY)
  ),
  'SELECT 1',
  'ALTER TABLE ticket_soporte_historial ADD CONSTRAINT fk_ticket_historial_estado_anterior FOREIGN KEY (estado_anterior) REFERENCES ticket_soporte_estados(codigo)'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  EXISTS (
    SELECT 1
    FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CAST(CONSTRAINT_SCHEMA AS BINARY) = CAST(@schema_name AS BINARY)
      AND CAST(CONSTRAINT_NAME AS BINARY) = CAST('fk_ticket_historial_estado_nuevo' AS BINARY)
  ),
  'SELECT 1',
  'ALTER TABLE ticket_soporte_historial ADD CONSTRAINT fk_ticket_historial_estado_nuevo FOREIGN KEY (estado_nuevo) REFERENCES ticket_soporte_estados(codigo)'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Archivo compacto sin claves foraneas: conserva evidencia incluso si se elimina una cuenta.
CREATE TABLE IF NOT EXISTS tickets_soporte_archivo (
  ticket_id BIGINT PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  solicitante_email VARCHAR(150) NOT NULL,
  tecnico_email VARCHAR(150) NULL,
  area VARCHAR(80) NOT NULL,
  titulo VARCHAR(120) NOT NULL,
  categoria VARCHAR(80) NOT NULL,
  prioridad VARCHAR(10) NOT NULL,
  estado_final VARCHAR(30) NOT NULL,
  resumen_resolucion VARCHAR(3000) NULL,
  cantidad_eventos INT NOT NULL DEFAULT 0,
  ultimo_evento VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  archived_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ticket_archivo_resuelto (resolved_at),
  INDEX idx_ticket_archivo_solicitante (solicitante_email)
);
