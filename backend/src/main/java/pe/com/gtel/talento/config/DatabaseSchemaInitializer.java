package pe.com.gtel.talento.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Auto-reparador de esquema y migraciones para entornos de desarrollo y evaluación.
 * Se ejecuta automáticamente al arrancar el backend con máxima prioridad (antes que cualquier runner).
 * Garantiza que las tablas de soporte, SLA, roles y columnas de postulante existan sin requerir
 * intervención manual por parte de los desarrolladores o evaluadores.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class DatabaseSchemaInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSchemaInitializer.class);
    private final JdbcTemplate jdbc;

    public DatabaseSchemaInitializer(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(String... args) {
        if (!isMySql()) {
            log.info("Entorno de prueba en memoria detectado. Omitiendo auto-reparador de MySQL.");
            return;
        }
        try {
            log.info("Verificando integridad automática del esquema de base de datos MySQL...");
            ensureMigrationHistory();
            ensureRoles();
            ensureSupportTables();
            ensureSlaPolicies();
            ensurePostulanteColumns();
            repairCorruptedCharacters();
            log.info("Esquema de base de datos verificado y 100% operativo.");
        } catch (Exception e) {
            log.warn("Aviso en verificación de esquema automático: {}", e.getMessage());
        }
    }

    private boolean isMySql() {
        try {
            var ds = jdbc.getDataSource();
            if (ds == null) return false;
            try (var conn = ds.getConnection()) {
                String name = conn.getMetaData().getDatabaseProductName().toLowerCase();
                return name.contains("mysql") || name.contains("mariadb");
            }
        } catch (Exception e) {
            return false;
        }
    }

    private void ensureMigrationHistory() {
        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS db_migration_history (
              id BIGINT AUTO_INCREMENT PRIMARY KEY,
              version VARCHAR(20) NOT NULL UNIQUE,
              filename VARCHAR(255) NOT NULL,
              checksum_sha256 CHAR(64) NOT NULL,
              applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              applied_by VARCHAR(150) NOT NULL,
              result ENUM('APPLIED','BASELINE','FAILED') NOT NULL,
              notes VARCHAR(1000) NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """);
    }

    private void ensureRoles() {
        jdbc.update("""
            INSERT INTO roles (nombre, descripcion)
            VALUES ('TECNICO', 'Técnico de sistemas y soporte')
            ON DUPLICATE KEY UPDATE descripcion=VALUES(descripcion);
        """);
    }

    private void ensureSupportTables() {
        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS tickets_soporte (
              id BIGINT AUTO_INCREMENT PRIMARY KEY,
              codigo VARCHAR(20) NULL UNIQUE,
              solicitante_id BIGINT NOT NULL,
              tecnico_id BIGINT NULL,
              area VARCHAR(80) NOT NULL DEFAULT 'Reclutamiento',
              titulo VARCHAR(120) NOT NULL,
              categoria VARCHAR(80) NOT NULL,
              subcategoria VARCHAR(100) NOT NULL,
              prioridad ENUM('BAJA','MEDIA','ALTA') NOT NULL DEFAULT 'MEDIA',
              justificacion_prioridad VARCHAR(1000) NOT NULL,
              descripcion VARCHAR(2000) NOT NULL,
              estado ENUM('NUEVO','ASIGNADO','EN_ATENCION','EN_ESPERA','RESUELTO','CERRADO') NOT NULL DEFAULT 'NUEVO',
              diagnostico VARCHAR(2000) NULL,
              solucion_propuesta VARCHAR(2000) NULL,
              propuesta_estado ENUM('SIN_PROPUESTA','PENDIENTE','APROBADA','RECHAZADA') NOT NULL DEFAULT 'SIN_PROPUESTA',
              comentario_administrador VARCHAR(1000) NULL,
              propuesta_actualizada_en TIMESTAMP NULL,
              evidencia_resolucion VARCHAR(2000) NULL,
              creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              resuelto_en TIMESTAMP NULL,
              cerrado_en TIMESTAMP NULL,
              INDEX idx_tickets_soporte_solicitante (solicitante_id),
              INDEX idx_tickets_soporte_tecnico (tecnico_id),
              INDEX idx_tickets_soporte_estado (estado),
              INDEX idx_tickets_soporte_prioridad (prioridad),
              INDEX idx_tickets_soporte_propuesta_estado (propuesta_estado)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """);

        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS tickets_soporte_historial (
              id BIGINT AUTO_INCREMENT PRIMARY KEY,
              ticket_id BIGINT NOT NULL,
              actor_id BIGINT NOT NULL,
              tipo_evento ENUM('CREADO','ASIGNADO','PROPUESTA_ENVIADA','PROPUESTA_APROBADA','PROPUESTA_RECHAZADA','ESTADO_CAMBIADO','RESUELTO','CERRADO','COMENTARIO') NOT NULL,
              estado_anterior VARCHAR(30) NULL,
              estado_nuevo VARCHAR(30) NULL,
              detalle VARCHAR(2000) NULL,
              creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              INDEX idx_tsh_ticket (ticket_id),
              INDEX idx_tsh_actor (actor_id),
              INDEX idx_tsh_creado_en (creado_en),
              CONSTRAINT fk_tsh_ticket FOREIGN KEY (ticket_id) REFERENCES tickets_soporte(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """);

        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS tickets_soporte_archivo (
              id BIGINT AUTO_INCREMENT PRIMARY KEY,
              ticket_id BIGINT NOT NULL UNIQUE,
              codigo VARCHAR(20) NOT NULL,
              solicitante_email VARCHAR(150) NOT NULL,
              tecnico_email VARCHAR(150) NULL,
              area VARCHAR(80) NOT NULL,
              titulo VARCHAR(120) NOT NULL,
              categoria VARCHAR(80) NOT NULL,
              subcategoria VARCHAR(100) NOT NULL,
              prioridad VARCHAR(20) NOT NULL,
              estado_final VARCHAR(30) NOT NULL,
              diagnostico VARCHAR(2000) NULL,
              solucion_propuesta VARCHAR(2000) NULL,
              evidencia_resolucion VARCHAR(2000) NULL,
              created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              resolved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              closed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              archived_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              retention_until TIMESTAMP NOT NULL,
              INDEX idx_tsa_retention (retention_until),
              INDEX idx_tsa_ticket (ticket_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """);

        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS tickets_soporte_notificaciones (
              id BIGINT AUTO_INCREMENT PRIMARY KEY,
              ticket_id BIGINT NOT NULL,
              usuario_id BIGINT NOT NULL,
              titulo VARCHAR(150) NOT NULL,
              mensaje VARCHAR(1000) NOT NULL,
              enlace VARCHAR(255) NOT NULL,
              leido BOOLEAN NOT NULL DEFAULT FALSE,
              creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              INDEX idx_tsn_usuario (usuario_id, leido),
              CONSTRAINT fk_tsn_ticket FOREIGN KEY (ticket_id) REFERENCES tickets_soporte(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """);
    }

    private void ensureSlaPolicies() {
        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS ticket_sla_politicas (
              id BIGINT AUTO_INCREMENT PRIMARY KEY,
              prioridad VARCHAR(10) NOT NULL UNIQUE,
              tiempo_resolucion_horas INT NOT NULL,
              tiempo_alerta_horas INT NOT NULL,
              descripcion VARCHAR(255) NULL,
              activo BOOLEAN DEFAULT TRUE,
              creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """);

        jdbc.update("""
            INSERT INTO ticket_sla_politicas (prioridad, tiempo_resolucion_horas, tiempo_alerta_horas, descripcion)
            VALUES 
              ('ALTA', 8, 4, 'Incidencia crítica para la operación.'),
              ('MEDIA', 24, 12, 'Incidencia que requiere atención prioritaria.'),
              ('BAJA', 48, 24, 'Solicitud o mejora que no afecta la continuidad.')
            ON DUPLICATE KEY UPDATE 
              tiempo_resolucion_horas=VALUES(tiempo_resolucion_horas),
              tiempo_alerta_horas=VALUES(tiempo_alerta_horas),
              descripcion=VALUES(descripcion),
              activo=TRUE;
        """);
    }

    private void ensurePostulanteColumns() {
        // Verifica si la tabla postulantes existe antes de operar
        Integer tableCount = jdbc.queryForObject(
            "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'postulantes'",
            Integer.class);
        if (tableCount == null || tableCount == 0) return;

        // Columna consentimiento_datos
        Integer colConsent = jdbc.queryForObject(
            "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'postulantes' AND COLUMN_NAME = 'consentimiento_datos'",
            Integer.class);
        if (colConsent != null && colConsent == 0) {
            jdbc.execute("ALTER TABLE postulantes ADD COLUMN consentimiento_datos TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Consentimiento de tratamiento de datos personales conforme a Ley 29733'");
            log.info("Auto-reparación: Columna consentimiento_datos agregada a postulantes.");
        }

        // Columna fecha_consentimiento
        Integer colConsentFecha = jdbc.queryForObject(
            "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'postulantes' AND COLUMN_NAME = 'fecha_consentimiento'",
            Integer.class);
        if (colConsentFecha != null && colConsentFecha == 0) {
            jdbc.execute("ALTER TABLE postulantes ADD COLUMN fecha_consentimiento TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Momento exacto en que se otorgó el consentimiento'");
            log.info("Auto-reparación: Columna fecha_consentimiento agregada a postulantes.");
        }

        // Columna numero_documento
        Integer colNumDoc = jdbc.queryForObject(
            "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'postulantes' AND COLUMN_NAME = 'numero_documento'",
            Integer.class);
        if (colNumDoc != null && colNumDoc == 0) {
            jdbc.execute("ALTER TABLE postulantes ADD COLUMN numero_documento VARCHAR(30) NULL");
            log.info("Auto-reparación: Columna numero_documento agregada a postulantes.");
        }

        // Sincronización bidireccional entre dni y numero_documento
        jdbc.update("UPDATE postulantes SET numero_documento = dni WHERE numero_documento IS NULL AND dni IS NOT NULL");
        jdbc.update("UPDATE postulantes SET dni = numero_documento WHERE dni IS NULL AND numero_documento IS NOT NULL");
    }

    private void repairCorruptedCharacters() {
        try {
            jdbc.update("UPDATE vacantes SET titulo = REPLACE(titulo, 'Telef?nicas', 'Telefónicas') WHERE titulo LIKE '%Telef?nicas%'");
            jdbc.update("UPDATE vacantes SET titulo = REPLACE(titulo, 'T?cnico', 'Técnico') WHERE titulo LIKE '%T?cnico%'");
            jdbc.update("UPDATE vacantes SET titulo = REPLACE(titulo, 'Atenci?n', 'Atención') WHERE titulo LIKE '%Atenci?n%'");
            jdbc.update("UPDATE vacantes SET titulo = REPLACE(titulo, 'Atracci?n', 'Atracción') WHERE titulo LIKE '%Atracci?n%'");
        } catch (Exception e) {
            // Ignorar silenciosamente si alguna columna no existe en entornos efímeros de test
        }
    }
}
