-- Completa las columnas requeridas por la entidad JPA Postulante.
-- Ejecutar despues de 011_support_sla_policies.sql.
USE gtel_talento;

ALTER TABLE postulantes
  ADD COLUMN consentimiento_datos BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN fecha_consentimiento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN consentimiento_version VARCHAR(30) NOT NULL DEFAULT 'v1.0-ley29733';
