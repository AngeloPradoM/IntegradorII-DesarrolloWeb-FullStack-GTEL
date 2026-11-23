package pe.com.gtel.talento.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import pe.com.gtel.talento.recruitment.job.scheduler.JobTrashScheduler;
import pe.com.gtel.talento.security.JwtService;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Contract and wiring verification test for GTEL Talento ATS.
 * Connects against QA MySQL instance (when QA_MYSQL_URL is set in CI) or H2 memory database.
 * Verifies that the unified schema, schedulers, security filter chains, and core API
 * endpoints operate as expected.
 */
@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:module-wiring;MODE=MySQL;DATABASE_TO_UPPER=FALSE;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=none",
    "spring.jpa.open-in-view=false",
    "spring.sql.init.mode=never",
    "jwt.secret=isolated-test-key-not-valid-outside-this-test-2026",
    "jwt.expiration-ms=60000",
    "otp.hash-secret=isolated-test-otp-secret-never-used-in-production",
    "app.security.test-access-enabled=false",
    "management.health.mail.enabled=false",
    "management.endpoints.web.exposure.include=health,info,metrics"
})
@AutoConfigureMockMvc(print = org.springframework.boot.test.autoconfigure.web.servlet.MockMvcPrint.NONE)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class ModuleWiringTest {

    private static final String QA_DATABASE_PATTERN = "gtel_qa_[A-Za-z0-9_]+";

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private MockMvc mvc;

    @Autowired
    private JwtService jwt;

    @Autowired
    private ApplicationContext context;

    @Autowired
    private ObjectMapper json;

    @MockitoBean
    private JavaMailSender mail;

    @org.springframework.test.context.DynamicPropertySource
    static void isolatedDatabase(org.springframework.test.context.DynamicPropertyRegistry registry) {
        String url = System.getenv("QA_MYSQL_URL");
        if (url != null && !url.isBlank()) {
            if (!url.matches("jdbc:mysql://[^/]+/" + QA_DATABASE_PATTERN + "(?:[?].*)?")) {
                throw new IllegalArgumentException("QA_MYSQL_URL must target an isolated gtel_qa_* database");
            }
            String normalizedUrl = url.toLowerCase(Locale.ROOT);
            if (normalizedUrl.matches(".*(?:allowmultiqueries|allowloadlocalinfile|allowurlinlocalinfile|autodeserialize)=true.*")) {
                throw new IllegalArgumentException("QA_MYSQL_URL enables an unsafe JDBC option");
            }
            String username = requiredEnvironment("QA_MYSQL_USER");
            String password = requiredEnvironment("QA_MYSQL_PASSWORD");
            registry.add("spring.datasource.url", () -> url);
            registry.add("spring.datasource.driver-class-name", () -> "com.mysql.cj.jdbc.Driver");
            registry.add("spring.datasource.username", () -> username);
            registry.add("spring.datasource.password", () -> password);
        }
    }

    private static String requiredEnvironment(String name) {
        String value = System.getenv(name);
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(name + " is required when QA_MYSQL_URL is configured");
        }
        return value;
    }

    @BeforeAll
    void schema() throws Exception {
        boolean h2 = isH2Database();
        if (!h2) {
            verifyIsolatedQaDatabase();
        }
        Path schemaPath = Files.exists(Path.of("database/schema/gtel_talento.sql"))
            ? Path.of("database/schema/gtel_talento.sql")
            : Path.of("../database/schema/gtel_talento.sql");
        assertTrue(Files.exists(schemaPath), "Consolidated database schema must be available");

        String schema = Files.readString(schemaPath)
            .replaceAll("(?m)--[^\\r\\n]*", "")
            .replaceAll("(?is)CREATE DATABASE IF NOT EXISTS.*?;", "")
            .replaceAll("(?i)USE gtel_talento;", "")
            .replaceAll("(?is)INSERT INTO vacantes\\s*\\(.*?;", "")
            .replaceAll("(?i) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci", "");

        // H2 validates wiring locally but does not implement MySQL's STORED/VIRTUAL keywords.
        // It also keeps COALESCE typed as ENUM unless the value is cast explicitly.
        // Keep the canonical MySQL schema unchanged and adapt only the in-memory copy.
        if (h2) {
            schema = schema
                .replaceAll("(?i)\\s+STORED\\b", "")
                .replaceAll(
                    "(?i)(incidente_activo_id\\s+BIGINT\\s+GENERATED\\s+ALWAYS\\s+AS\\s*"
                        + "\\(CASE\\s+WHEN\\s+resuelto_at\\s+IS\\s+NULL\\s+THEN\\s+incidente_id\\s+"
                        + "ELSE\\s+NULL\\s+END\\))\\s+VIRTUAL\\b",
                    "$1")
                .replace("COALESCE(prioridad,'*')", "COALESCE(CAST(prioridad AS VARCHAR(2)),'*')");
        }

        for (String sql : schema.split(";")) {
            String trimmed = sql.trim();
            if (!trimmed.isBlank()) {
                jdbc.execute(trimmed);
            }
        }

        // Sembrado de cuentas básicas para pruebas de integración
        jdbc.update("""
            INSERT INTO usuarios(id, email, password_hash, rol_id, estado) VALUES
            (101, 'candidate@example.test', 'unused', 1, 'activo'),
            (102, 'recruiter@example.test', 'unused', 2, 'activo'),
            (103, 'admin@example.test', 'unused', 3, 'activo')
            ON DUPLICATE KEY UPDATE estado='activo'
            """);
    }

    private boolean isH2Database() {
        String product = jdbc.execute((ConnectionCallback<String>) connection ->
            connection.getMetaData().getDatabaseProductName());
        return "H2".equalsIgnoreCase(product);
    }

    private void verifyIsolatedQaDatabase() {
        String database = jdbc.queryForObject("SELECT DATABASE()", String.class);
        if (database == null || !database.matches(QA_DATABASE_PATTERN)) {
            throw new IllegalStateException("Integration tests may only initialize an isolated gtel_qa_* database");
        }
    }

    private String token(String email, String role) {
        return "Bearer " + jwt.createToken(email, role);
    }

    @Test
    void publicRoutesAndSchedulersAreDiscovered() throws Exception {
        mvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(header().string(
                        "Permissions-Policy",
                        "geolocation=(), camera=(), microphone=()"));
        mvc.perform(get("/actuator/health")).andExpect(status().isOk());
        mvc.perform(get("/api/jobs")).andExpect(status().isOk());
        assertNotNull(context.getBean(JobTrashScheduler.class), "JobTrashScheduler bean must be present");
    }

    @Test
    void unauthenticatedAccessIsProtected() throws Exception {
        mvc.perform(get("/api/admin/audit")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/recruiter/jobs/trash")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/recruiter/applications")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/production-incidents")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/production-incidents/indicators")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/production-incidents/export")).andExpect(status().isUnauthorized());
    }

    @Test
    void adminAuditEndpointEnforcesRole() throws Exception {
        mvc.perform(get("/api/admin/audit")
                .header("Authorization", token("admin@example.test", "ADMIN")))
            .andExpect(status().isOk());

        mvc.perform(get("/api/admin/audit")
                .header("Authorization", token("recruiter@example.test", "RECLUTADOR")))
            .andExpect(status().isForbidden());
    }

    @Test
    void recruiterTrashEndpointEnforcesRole() throws Exception {
        mvc.perform(get("/api/recruiter/jobs/trash")
                .header("Authorization", token("recruiter@example.test", "RECLUTADOR")))
            .andExpect(status().isOk());

        mvc.perform(get("/api/recruiter/jobs/trash")
                .header("Authorization", token("candidate@example.test", "CANDIDATO")))
            .andExpect(status().isForbidden());
    }

    @Test
    void passwordRecoveryEndpointResponds() throws Exception {
        mvc.perform(post("/api/auth/password/request")
                .contentType("application/json")
                .content("{\"email\":\"candidate@example.test\"}"))
            .andExpect(status().isOk());
    }
}
