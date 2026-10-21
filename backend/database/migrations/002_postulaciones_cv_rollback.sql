-- =============================================================================
-- ROLLBACK MIGRACIÓN 002: Revertir columnas de CV adjunto en postulaciones
-- Base de datos destino: gtel_talento_mejoras
-- =============================================================================

USE gtel_talento_mejoras;

ALTER TABLE postulaciones DROP COLUMN IF EXISTS cv_url;
ALTER TABLE postulaciones DROP COLUMN IF EXISTS cv_nombre;
