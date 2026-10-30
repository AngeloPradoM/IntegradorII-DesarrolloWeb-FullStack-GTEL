-- Compatibilidad del esquema de notificaciones con el módulo JPA actual.
-- Es aditiva e idempotente: conserva las columnas y los registros históricos.
USE gtel_talento;

SET @add_tipo = IF(
  EXISTS(SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notificaciones' AND COLUMN_NAME = 'tipo'),
  'SELECT 1',
  "ALTER TABLE notificaciones ADD COLUMN tipo VARCHAR(50) NOT NULL DEFAULT 'SISTEMA' AFTER mensaje"
);
PREPARE statement_tipo FROM @add_tipo;
EXECUTE statement_tipo;
DEALLOCATE PREPARE statement_tipo;

SET @add_enlace = IF(
  EXISTS(SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notificaciones' AND COLUMN_NAME = 'enlace'),
  'SELECT 1',
  'ALTER TABLE notificaciones ADD COLUMN enlace VARCHAR(255) NULL AFTER tipo'
);
PREPARE statement_enlace FROM @add_enlace;
EXECUTE statement_enlace;
DEALLOCATE PREPARE statement_enlace;

SET @add_created_at = IF(
  EXISTS(SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notificaciones' AND COLUMN_NAME = 'created_at'),
  'SELECT 1',
  'ALTER TABLE notificaciones ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER leida'
);
PREPARE statement_created_at FROM @add_created_at;
EXECUTE statement_created_at;
DEALLOCATE PREPARE statement_created_at;

-- Conserva la fecha histórica cuando la tabla proviene de la migración 004.
SET @copy_fecha = IF(
  EXISTS(SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notificaciones' AND COLUMN_NAME = 'fecha'),
  'UPDATE notificaciones SET created_at = fecha WHERE fecha IS NOT NULL',
  'SELECT 1'
);
PREPARE statement_fecha FROM @copy_fecha;
EXECUTE statement_fecha;
DEALLOCATE PREPARE statement_fecha;
