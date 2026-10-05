-- Ejecutar después de 004. No elimina datos existentes.
USE gtel_talento;
CREATE TABLE IF NOT EXISTS vacantes_papelera (
 vacante_id BIGINT PRIMARY KEY,
 eliminada_en BIGINT NOT NULL,
 eliminar_despues BIGINT NOT NULL,
 usuario_id BIGINT NOT NULL,
 FOREIGN KEY (vacante_id) REFERENCES vacantes(id),
 FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
 INDEX idx_papelera_vencimiento (eliminar_despues)
) ENGINE=InnoDB;
