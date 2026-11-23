package pe.com.gtel.talento.incident.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.Test;

class IncidentReportingMigrationTest {
    @Test
    void migrationAddsConfigurableReportingPersistenceWithoutParallelIncidentModel() throws Exception {
        String sql = Files.readString(Path.of("../database/migrations/016_incident_reporting.sql"));

        assertTrue(sql.contains("CREATE TABLE IF NOT EXISTS incidente_categorias"));
        assertTrue(sql.contains("CREATE TABLE IF NOT EXISTS incidente_sla_politicas"));
        assertTrue(sql.contains("CREATE TABLE IF NOT EXISTS incidente_asignacion_reglas"));
        assertTrue(sql.contains("CREATE TABLE IF NOT EXISTS incidente_escalamientos"));
        assertTrue(sql.contains("ALTER TABLE incidentes_produccion"));
        assertTrue(sql.contains("primera_atencion_at TIMESTAMP NULL"));
        assertTrue(sql.contains("solucion_aplicada TEXT NULL"));
        assertTrue(sql.contains("causa_raiz TEXT NULL"));
        assertTrue(sql.contains("aprendizaje TEXT NULL"));
        assertTrue(sql.contains("falla_repetida BOOLEAN NOT NULL DEFAULT FALSE"));
        assertTrue(sql.contains("sla_primera_atencion_at TIMESTAMP NULL"));
        assertTrue(sql.contains("sla_resolucion_at TIMESTAMP NULL"));
        assertTrue(sql.contains("('P1',15,240"));
        assertTrue(sql.contains("('P2',30,480"));
        assertTrue(sql.contains("('P3',240,1440"));
        assertTrue(sql.contains("('P4',480,4320"));
        assertTrue(sql.contains("u.estado='activo' AND r.nombre='TECNICO'"));
        assertTrue(sql.contains("UNIQUE KEY uk_incidente_regla"));
        assertTrue(sql.contains("UNIQUE KEY uk_incidente_escalamiento_activo"));
        assertFalse(sql.contains("tecnico1@gmail.com"));
        assertFalse(sql.contains("UPDATE tickets_soporte SET estado"));
        assertFalse(sql.contains("UPDATE solicitudes_cambio SET estado"));
        assertFalse(sql.contains("DROP TABLE"));
    }

    @Test
    void cleanSchemasAndRepositoryExposeTheSamePersistenceContract() throws Exception {
        String canonical = Files.readString(Path.of("../database/schema/gtel_talento.sql"));
        String bootstrap = Files.readString(Path.of("../database/gtel_talento.sql"));
        String schemaCheck = Files.readString(Path.of("../database/scripts/check-schema.sql"));
        String repository = Files.readString(Path.of(
            "src/main/java/pe/com/gtel/talento/incident/repository/IncidentConfigurationRepository.java"));

        for (String required : new String[] { "incidente_categorias", "incidente_sla_politicas",
                "incidente_asignacion_reglas", "incidente_escalamientos", "categoria_codigo",
                "primera_atencion_at", "sla_resolucion_at" }) {
            assertTrue(canonical.contains(required), required + " falta en schema/gtel_talento.sql");
            assertTrue(bootstrap.contains(required), required + " falta en gtel_talento.sql");
        }
        assertTrue(repository.contains("rol.nombre='TECNICO'"));
        assertTrue(repository.contains("COUNT(i.id) carga_activa"));
        assertTrue(repository.contains("ar.precedencia,COUNT(i.id),u.id"));
        assertTrue(repository.contains("ar.prioridad=? OR ar.prioridad IS NULL"));
        String mysql8EscalationGuard = "incidente_activo_id BIGINT GENERATED ALWAYS AS "
            + "(CASE WHEN resuelto_at IS NULL THEN incidente_id ELSE NULL END) VIRTUAL";
        assertTrue(canonical.contains(mysql8EscalationGuard));
        assertTrue(bootstrap.contains(mysql8EscalationGuard));
        assertTrue(schemaCheck.contains("core tables (41)"));
        assertTrue(schemaCheck.contains("production incident tables (9)"));
        assertTrue(schemaCheck.contains("incident reporting columns (16)"));
        assertTrue(schemaCheck.contains("incident SLA policies (4)"));
    }

    @Test
    void migration016RegistrationIsGuardedAndDoesNotAlterFunctionalData() throws Exception {
        String sql = Files.readString(Path.of("../database/scripts/register-016-after-verification.sql"));

        assertTrue(sql.contains("@migration_016_tables = 9"));
        assertTrue(sql.contains("@migration_016_columns = 16"));
        assertTrue(sql.contains("@migration_016_categories >= 10"));
        assertTrue(sql.contains("@migration_016_sla = 4"));
        assertTrue(sql.contains("@migration_016_rules > 0"));
        assertTrue(sql.contains("6216076ccb96a52b8632641d6f6d746a25dcf0d0b2220d6ef0be8af68fc31b9b"));
        assertTrue(sql.contains("INSERT INTO db_migration_history"));
        assertTrue(sql.contains("WHERE @migration_016_ready"));
        assertFalse(sql.contains("ALTER TABLE"));
        assertFalse(sql.contains("DROP TABLE"));
        assertFalse(sql.contains("UPDATE incidentes_produccion"));
        assertFalse(sql.contains("DELETE FROM"));
    }
}
