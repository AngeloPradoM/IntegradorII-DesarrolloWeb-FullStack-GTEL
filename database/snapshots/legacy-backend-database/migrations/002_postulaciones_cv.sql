-- =============================================================================
-- MIGRACIÓN 002: Agregar soporte de CV adjunto a la tabla postulaciones
-- Base de datos destino: gtel_talento_mejoras
-- Reversible: Sí (ver 002_postulaciones_cv_rollback.sql)
-- =============================================================================

USE gtel_talento_mejoras;

ALTER TABLE postulaciones ADD COLUMN IF NOT EXISTS cv_url VARCHAR(255) NULL;
ALTER TABLE postulaciones ADD COLUMN IF NOT EXISTS cv_nombre VARCHAR(255) NULL;
