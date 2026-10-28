-- Completa las columnas requeridas por la entidad JPA Postulante (idempotente).
-- Ejecutar despues de 011_support_sla_policies.sql.
USE gtel_talento;

SET @add_consentimiento = IF(
  EXISTS(SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'postulantes' AND COLUMN_NAME = 'consentimiento_datos'),
  'SELECT 1',
  'ALTER TABLE postulantes ADD COLUMN consentimiento_datos BOOLEAN NOT NULL DEFAULT TRUE'
);
PREPARE stmt FROM @add_consentimiento;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_fecha = IF(
  EXISTS(SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'postulantes' AND COLUMN_NAME = 'fecha_consentimiento'),
  'SELECT 1',
  'ALTER TABLE postulantes ADD COLUMN fecha_consentimiento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP'
);
PREPARE stmt FROM @add_fecha;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_version = IF(
  EXISTS(SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'postulantes' AND COLUMN_NAME = 'consentimiento_version'),
  'SELECT 1',
  "ALTER TABLE postulantes ADD COLUMN consentimiento_version VARCHAR(30) NOT NULL DEFAULT 'v1.0-ley29733'"
);
PREPARE stmt FROM @add_version;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Compatibilidad total de identificadores de documento (dni y numero_documento)
SET @sync_dni = IF(
  EXISTS(SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'postulantes' AND COLUMN_NAME = 'dni'),
  'ALTER TABLE postulantes MODIFY COLUMN dni VARCHAR(30) NULL',
  'ALTER TABLE postulantes ADD COLUMN dni VARCHAR(30) NULL'
);
PREPARE stmt FROM @sync_dni;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sync_num_doc = IF(
  EXISTS(SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'postulantes' AND COLUMN_NAME = 'numero_documento'),
  'ALTER TABLE postulantes MODIFY COLUMN numero_documento VARCHAR(30) NULL',
  'ALTER TABLE postulantes ADD COLUMN numero_documento VARCHAR(30) NULL'
);
PREPARE stmt FROM @sync_num_doc;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE postulantes SET numero_documento = dni WHERE numero_documento IS NULL AND dni IS NOT NULL;
UPDATE postulantes SET dni = numero_documento WHERE dni IS NULL AND numero_documento IS NOT NULL;
