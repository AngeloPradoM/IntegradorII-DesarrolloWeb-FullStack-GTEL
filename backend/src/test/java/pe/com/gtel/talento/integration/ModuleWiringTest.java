package pe.com.gtel.talento.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
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
            if (!url.matches("jdbc:mysql://[^/]+/gtel_qa_[A-Za-z0-9_]+(?:[?].*)?")) {
                throw new IllegalArgumentException("QA_MYSQL_URL must target an isolated gtel_qa_* database");
            }
            registry.add("spring.datasource.url", () -> url);
            registry.add("spring.datasource.driver-class-name", () -> "com.mysql.cj.jdbc.Driver");
            registry.add("spring.datasource.username", () -> System.getenv("QA_MYSQL_USER"));
            registry.add("spring.datasource.password", () -> System.getenv("QA_MYSQL_PASSWORD"));
        }
    }

    @BeforeAll
    void schema() throws Exception {
        Path schemaPath = Files.exists(Path.of("database/schema/gtel_talento.sql"))
            ? Path.of("database/schema/gtel_talento.sql")
            : (Files.exists(Path.of("../database/schema/gtel_talento.sql"))
                ? Path.of("../database/schema/gtel_talento.sql")
                : Path.of("../database/gtel_talento.sql"));

        String schema = Files.readString(schemaPath)
            .replaceAll("(?m)--[^\\r\\n]*", "")
            .replaceAll("(?is)CREATE DATABASE IF NOT EXISTS.*?;", "")
            .replaceAll("(?i)USE gtel_talento;", "")
            .replaceAll("(?i) ENGINE=InnoDB", "");

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

    private String token(String email, String role) {
        return "Bearer " + jwt.createToken(email, role);
    }

    @Test
    void publicRoutesAndSchedulersAreDiscovered() throws Exception {
        mvc.perform(get("/api/health")).andExpect(status().isOk());
        mvc.perform(get("/actuator/health")).andExpect(status().isOk());
        mvc.perform(get("/api/jobs")).andExpect(status().isOk());
        assertNotNull(context.getBean(JobTrashScheduler.class), "JobTrashScheduler bean must be present");
    }

    @Test
    void unauthenticatedAccessIsProtected() throws Exception {
        mvc.perform(get("/api/admin/audit")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/recruiter/jobs/trash")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/recruiter/applications")).andExpect(status().isUnauthorized());
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
