-- Infraestructura de control para las migraciones consolidadas.
-- Solo crea la bitacora; no marca migraciones anteriores como aplicadas.
USE gtel_talento;

CREATE TABLE IF NOT EXISTS db_migration_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  version VARCHAR(20) NOT NULL UNIQUE,
  filename VARCHAR(255) NOT NULL,
  checksum_sha256 CHAR(64) NOT NULL,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  applied_by VARCHAR(150) NOT NULL,
  result ENUM('APPLIED','BASELINE','FAILED') NOT NULL,
  notes VARCHAR(1000) NULL
);
