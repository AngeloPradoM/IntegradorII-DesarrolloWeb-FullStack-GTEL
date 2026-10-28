-- Aplicar una sola vez después de 005, antes de reiniciar.
USE gtel_talento;
ALTER TABLE auditoria ADD COLUMN actor_id_historico BIGINT NULL;
ALTER TABLE auditoria ADD COLUMN actor_email_historico VARCHAR(150) NULL;
