USE gtel_talento;
SET SESSION lock_wait_timeout = 15;

-- Aplicar una vez en gtel_talento antes de iniciar la version con OTP.
-- No modifica cuentas existentes. Tiempos UTC expresados en epoch milisegundos.
CREATE TABLE auth_email_challenges (
  usuario_id BIGINT NOT NULL PRIMARY KEY,
  session_id VARCHAR(36) NOT NULL UNIQUE,
  email VARCHAR(150) NOT NULL,
  rol VARCHAR(50) NOT NULL,
  code_hash VARCHAR(64) NOT NULL,
  expires_at BIGINT NOT NULL,
  deadline BIGINT NOT NULL,
  resend_at BIGINT NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  sends INT NOT NULL DEFAULT 0,
  consumed BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_auth_challenge_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;
