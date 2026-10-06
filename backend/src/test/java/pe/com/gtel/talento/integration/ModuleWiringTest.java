package pe.com.gtel.talento.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import pe.com.gtel.talento.notification.scheduler.NotificationScheduler;
import pe.com.gtel.talento.recruitment.job.scheduler.JobTrashScheduler;
import pe.com.gtel.talento.security.JwtService;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Boots the real component scan/security chain against an ephemeral DB, without local configuration. */
@SpringBootTest(properties = {
    "spring.config.location=optional:classpath:/refactor-test.properties",
    "spring.datasource.url=jdbc:h2:mem:module-wiring;MODE=MySQL;DATABASE_TO_UPPER=FALSE;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=none",
    "spring.jpa.open-in-view=false",
    "spring.sql.init.mode=never",
    "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration",
    "debug=false",
    "logging.level.root=WARN",
    "logging.level.org.springframework=WARN",
    "jwt.secret=isolated-test-key-not-valid-outside-this-test-2026",
    "jwt.expiration-ms=60000",
    "otp.hash-secret=isolated-test-otp-secret-never-used-in-production",
    "app.security.test-access-enabled=false",
    "app.scheduling.enabled=false",
    "app.notifications.email-enabled=true"
})
@AutoConfigureMockMvc(print = org.springframework.boot.test.autoconfigure.web.servlet.MockMvcPrint.NONE)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class ModuleWiringTest {
    @Autowired JdbcTemplate jdbc;
    @Autowired MockMvc mvc;
    @Autowired JwtService jwt;
    @Autowired ApplicationContext context;
    @Autowired ObjectMapper json;
    @MockitoBean JavaMailSender mail;

    @BeforeAll void schema() throws Exception {
        String schema = Files.readString(Path.of("database/schema/gtel_talento.sql"))
            .replaceAll("(?m)--[^\\r\\n]*", "")
            .replaceAll("(?is)CREATE DATABASE IF NOT EXISTS.*?;", "")
            .replaceAll("(?i)USE gtel_talento;", "")
            .replaceAll("(?i) ENGINE=InnoDB", "");
        for (String sql : schema.split(";")) if (!sql.isBlank()) jdbc.execute(sql);
        jdbc.update("""
            INSERT INTO usuarios(id,email,password_hash,rol_id,estado) VALUES
            (101,'candidate@example.test','unused',1,'activo'),
            (102,'recruiter@example.test','unused',2,'activo'),
            (103,'admin@example.test','unused',3,'activo')
            """);
    }

    String token(String name, String role) {
        return "Bearer " + jwt.createToken(name + "@example.test", role);
    }

    @Test void publicRoutesAndSchedulersAreDiscovered() throws Exception {
        mvc.perform(get("/api/health")).andExpect(status().isOk());
        mvc.perform(get("/api/jobs")).andExpect(status().isOk()).andExpect(content().json("[]"));
        assertNotNull(context.getBean(JobTrashScheduler.class));
        assertNotNull(context.getBean(NotificationScheduler.class));
        assertFalse(context.containsBean("developmentAccounts"));
    }

    @Test void movedControllersKeepRecruiterRoutesAndPayloads() throws Exception {
        for (String path : new String[]{"/api/recruiter/jobs", "/api/recruiter/jobs/trash",
            "/api/recruiter/applications", "/api/recruiter/selection/interviews",
            "/api/recruiter/selection/evaluations"}) {
            mvc.perform(get(path).header("Authorization", token("recruiter", "RECLUTADOR")))
                .andExpect(status().isOk()).andExpect(content().json("[]"));
            mvc.perform(get(path).header("Authorization", token("candidate", "CANDIDATO")))
                .andExpect(status().isForbidden());
        }
    }

    @Test void profileNotificationsAndAuditKeepTheirContracts() throws Exception {
        mvc.perform(get("/api/profile").header("Authorization", token("candidate", "CANDIDATO")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.email").value("candidate@example.test"));
        mvc.perform(get("/api/notifications").header("Authorization", token("candidate", "CANDIDATO")))
            .andExpect(status().isOk()).andExpect(content().json("[]"));
        mvc.perform(get("/api/admin/audit").header("Authorization", token("admin", "ADMIN")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.items").isArray())
            .andExpect(jsonPath("$.total").value(0));
        mvc.perform(get("/api/admin/audit").header("Authorization", token("recruiter", "RECLUTADOR")))
            .andExpect(status().isForbidden());
        mvc.perform(get("/api/candidate/applications")).andExpect(status().isUnauthorized());
    }

    @Test
    @org.springframework.transaction.annotation.Transactional
    void frontendWriteContractsCompleteTheRecruitmentWorkflow() throws Exception {
        String recruiter = token("recruiter", "RECLUTADOR");
        String candidate = token("candidate", "CANDIDATO");
        String admin = token("admin", "ADMIN");
        jdbc.update("INSERT INTO postulantes(usuario_id,nombres,apellidos) VALUES(101,'Ana','Prueba')");
        var created = mvc.perform(post("/api/recruiter/jobs").header("Authorization", recruiter)
            .contentType("application/json").content("""
                {"title":"Oferta HTTP","description":"Prueba de contrato","department":"Ventas",
                 "location":"Lima","type":"full_time","modality":"presencial","salaryMin":1000,
                 "salaryMax":2000,"vacancies":1,"status":"activa","tags":["Ventas"]}
                """))
            .andExpect(status().isOk()).andExpect(jsonPath("$.title").value("Oferta HTTP"))
            .andReturn();
        long jobId = json.readTree(created.getResponse().getContentAsString()).get("id").asLong();
        mvc.perform(put("/api/profile").header("Authorization", candidate).contentType("application/json").content("""
            {"nombres":"Ana","apellidos":"Prueba","telefono":"+51987654321",
             "ubicacion":"Lima","localidad":"Miraflores","educacion":"Ingeniería","experiencia":"Ventas"}
            """)).andExpect(status().isOk()).andExpect(jsonPath("$.educacion").value("Ingeniería"));
        var data = new MockMultipartFile("data", "", "application/json", """
            {"nombres":"Ana","apellidos":"Prueba","dni":"12345678","telefono":"+51987654321","distrito":"Lima"}
            """.getBytes(StandardCharsets.UTF_8));
        var cv = new MockMultipartFile("cv", "cv.pdf", "application/pdf", "%PDF-1.4\nfixture\n%%EOF".getBytes(StandardCharsets.US_ASCII));
        var applied = mvc.perform(multipart("/api/candidate/applications/" + jobId).file(data).file(cv)
            .param("terms", "true").header("Authorization", candidate))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.dni").value("12345678")).andReturn();
        long applicationId = json.readTree(applied.getResponse().getContentAsString()).get("id").asLong();
        mvc.perform(get("/api/applications/" + applicationId + "/cv").header("Authorization", candidate))
            .andExpect(status().isOk()).andExpect(content().bytes(cv.getBytes()));
        mvc.perform(put("/api/recruiter/applications/" + applicationId + "/status")
            .header("Authorization", recruiter).contentType("application/json").content("{\"status\":\"entrevista\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("entrevista"));
        mvc.perform(post("/api/recruiter/selection/interviews").header("Authorization", recruiter)
            .contentType("application/json").content(json.writeValueAsString(java.util.Map.of(
                "applicationId", applicationId, "date", LocalDate.now().plusDays(2).toString(),
                "time", "10:00", "minutes", 30, "type", "video", "location", "Sala QA", "status", "programada"))))
            .andExpect(status().isOk()).andExpect(jsonPath("$.applicationId").value(applicationId));
        mvc.perform(post("/api/recruiter/selection/evaluations").header("Authorization", recruiter)
            .contentType("application/json").content("""
                {"applicationId":%d,"test":"Técnica","minutes":30,"status":"aprobado",
                 "details":[{"area":"Comunicación","score":90,"note":"Prueba"}]}
                """.formatted(applicationId)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.score").value(90));
        mvc.perform(get("/api/admin/users").header("Authorization", admin))
            .andExpect(status().isOk()).andExpect(jsonPath("$.items").isArray())
            .andExpect(jsonPath("$.total").value(3)).andExpect(jsonPath("$.page").value(0));
    }
}
