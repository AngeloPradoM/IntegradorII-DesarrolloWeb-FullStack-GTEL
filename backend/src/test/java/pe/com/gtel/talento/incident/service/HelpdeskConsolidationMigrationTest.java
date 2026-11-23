package pe.com.gtel.talento.incident.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.regex.Pattern;
import org.junit.jupiter.api.Test;

class HelpdeskConsolidationMigrationTest {
    @Test
    void migration017IsAdditiveAndDefinesStructuredIntegrity() throws Exception {
        String sql=Files.readString(Path.of("../database/migrations/017_helpdesk_consolidation.sql"));
        assertTrue(sql.contains("CREATE TABLE IF NOT EXISTS solicitud_tipos"));
        assertTrue(sql.contains("CREATE TABLE IF NOT EXISTS incidente_tipos_problema"));
        assertTrue(sql.contains("chk_ticket_tipo_estructurado"));
        assertTrue(sql.contains("fk_incidente_tipo_categoria_compuesta"));
        assertFalse(Pattern.compile("(?im)^\\s*(UPDATE|DELETE|TRUNCATE)\\s+").matcher(sql).find());
    }

    @Test
    void migration018ContainsExpectedIdempotentCatalogsWithoutOverwrite() throws Exception {
        String sql=Files.readString(Path.of("../database/migrations/018_helpdesk_catalog_seed.sql"));
        assertEquals(11,Pattern.compile("\\('SOL_[A-Z_]+',").matcher(sql).results().count());
        assertEquals(16,Pattern.compile("\\('INC_[A-Z_]+',").matcher(sql).results().count());
        assertEquals(2,Pattern.compile("(?i)INSERT IGNORE INTO").matcher(sql).results().count());
        assertFalse(sql.toUpperCase().contains("ON DUPLICATE KEY UPDATE"));
    }

    @Test
    void migration019DefinesPersistentTicketIdempotencyWithoutChangingTickets() throws Exception {
        String sql=Files.readString(Path.of("../database/migrations/019_support_ticket_idempotency.sql"));
        assertTrue(sql.contains("CREATE TABLE IF NOT EXISTS ticket_creacion_idempotencia"));
        assertTrue(sql.contains("PRIMARY KEY (solicitante_id,clave_idempotencia)"));
        assertTrue(sql.contains("solicitud_hash"));
        assertTrue(sql.contains("REFERENCES tickets_soporte(id) ON DELETE CASCADE"));
        assertFalse(Pattern.compile("(?im)^\s*(UPDATE|DELETE|TRUNCATE|ALTER)\s+").matcher(sql).find());
    }
}
