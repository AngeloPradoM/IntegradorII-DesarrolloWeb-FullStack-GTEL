package pe.com.gtel.talento.incident.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;

class ProductionIncidentMigrationTest {
    @Test void migrationIsAdditiveAndKeepsTicketAndRfcStatesIndependent() throws Exception {
        String sql = Files.readString(Path.of("../database/migrations/015_production_incidents.sql"));
        assertTrue(sql.contains("CREATE TABLE IF NOT EXISTS incidentes_produccion"));
        assertTrue(sql.contains("CREATE TABLE IF NOT EXISTS incidente_historial"));
        assertTrue(sql.contains("CREATE TABLE IF NOT EXISTS incidente_actividades"));
        assertTrue(sql.contains("CREATE TABLE IF NOT EXISTS incidente_ticket"));
        assertTrue(sql.contains("CREATE TABLE IF NOT EXISTS incidente_cambio"));
        assertTrue(sql.contains("clave_deduplicacion CHAR(64) NULL UNIQUE"));
        assertTrue(sql.contains("version INT NOT NULL DEFAULT 0"));
        assertTrue(sql.contains("PRIMARY KEY (incidente_id, ticket_id)"));
        assertTrue(sql.contains("PRIMARY KEY (incidente_id, solicitud_cambio_id)"));
        assertTrue(sql.contains("REFERENCES tickets_soporte(id) ON DELETE CASCADE"));
        assertTrue(sql.contains("REFERENCES solicitudes_cambio(id) ON DELETE CASCADE"));
        assertFalse(sql.contains("UPDATE tickets_soporte SET estado"));
        assertFalse(sql.contains("UPDATE solicitudes_cambio SET estado"));
        assertFalse(sql.contains("DROP TABLE"));
    }

    @Test void repositoryPersistsOperationalDatesVersionsHistoryAndIndependentRelations() throws Exception {
        String repository = Files.readString(Path.of(
            "src/main/java/pe/com/gtel/talento/incident/repository/ProductionIncidentRepository.java"));
        assertTrue(repository.contains("primera_atencion_at=COALESCE(primera_atencion_at,CURRENT_TIMESTAMP)"));
        assertTrue(repository.contains("categoria_sugerida,categoria_codigo,incidente_tipo_codigo"));
        assertTrue(repository.contains("recuperado_at=COALESCE(recuperado_at,CURRENT_TIMESTAMP)"));
        assertTrue(repository.contains("verificado_at=CURRENT_TIMESTAMP"));
        assertTrue(repository.contains("cerrado_at=CURRENT_TIMESTAMP"));
        assertTrue(repository.contains("estado=? AND version=?"));
        assertTrue(repository.contains("INSERT INTO incidente_historial"));
        assertTrue(repository.contains("INSERT IGNORE INTO incidente_ticket"));
        assertTrue(repository.contains("INSERT IGNORE INTO incidente_cambio"));
        assertFalse(repository.contains("UPDATE tickets_soporte SET estado"));
        assertFalse(repository.contains("UPDATE solicitudes_cambio SET estado"));
    }
}
