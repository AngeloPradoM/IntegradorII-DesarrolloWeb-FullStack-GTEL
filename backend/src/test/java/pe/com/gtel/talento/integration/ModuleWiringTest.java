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
    "app.notifications.email-enabled=true",
    "management.endpoints.web.exposure.include=health,info,metrics"
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

    @org.springframework.test.context.DynamicPropertySource
    static void isolatedDatabase(org.springframework.test.context.DynamicPropertyRegistry registry){
        String url=System.getenv("QA_MYSQL_URL");
        if(url!=null&&!url.isBlank()){
            if(!url.matches("jdbc:mysql://[^/]+/gtel_qa_[A-Za-z0-9_]+(?:[?].*)?"))throw new IllegalArgumentException("QA_MYSQL_URL must target an isolated gtel_qa_* database");
            registry.add("spring.datasource.url",()->url);registry.add("spring.datasource.driver-class-name",()->"com.mysql.cj.jdbc.Driver");
            registry.add("spring.datasource.username",()->System.getenv("QA_MYSQL_USER"));registry.add("spring.datasource.password",()->System.getenv("QA_MYSQL_PASSWORD"));
        }
    }

    @BeforeAll void schema() throws Exception {
        if(System.getenv("QA_MYSQL_URL")!=null && jdbc.queryForObject("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE()",Long.class)>0)throw new IllegalStateException("MySQL QA database must be empty");
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
        mvc.perform(get("/actuator/health")).andExpect(status().isOk());
        mvc.perform(get("/api/jobs")).andExpect(status().isOk()).andExpect(content().json("[]"));
        assertNotNull(context.getBean(JobTrashScheduler.class));
        assertNotNull(context.getBean(NotificationScheduler.class));
        assertFalse(context.containsBean("developmentAccounts"));
    }

    @Test void operationalMetricsRequireAdministrator() throws Exception {
        mvc.perform(get("/actuator/metrics")).andExpect(status().isUnauthorized());
        mvc.perform(get("/actuator/metrics").header("Authorization", token("candidate", "CANDIDATO")))
            .andExpect(status().isForbidden());
        mvc.perform(get("/actuator/metrics").header("Authorization", token("recruiter", "RECLUTADOR")))
            .andExpect(status().isForbidden());
        mvc.perform(get("/actuator/metrics").header("Authorization", token("admin", "ADMIN")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.names").isArray());
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
        // Entrega 1: recruiters share the team workspace; candidates retain private access.
        jdbc.update("INSERT INTO usuarios(id,email,password_hash,rol_id,estado) VALUES (104,'othercandidate@example.test','unused',1,'activo'),(105,'otherrecruiter@example.test','unused',2,'activo')");
        mvc.perform(get("/api/applications/" + applicationId + "/cv")
            .header("Authorization", token("othercandidate", "CANDIDATO")))
            .andExpect(status().isNotFound());
        mvc.perform(get("/api/candidate/applications")
            .header("Authorization", token("othercandidate", "CANDIDATO")))
            .andExpect(status().isOk()).andExpect(content().json("[]"));
        for (String authorized : new String[]{token("otherrecruiter", "RECLUTADOR"), admin}) {
            mvc.perform(get("/api/recruiter/applications/" + applicationId).header("Authorization", authorized))
                .andExpect(status().isOk()).andExpect(jsonPath("$.id").value(applicationId));
            mvc.perform(get("/api/applications/" + applicationId + "/cv").header("Authorization", authorized))
                .andExpect(status().isOk()).andExpect(content().bytes(cv.getBytes()));
        }
        mvc.perform(get("/api/applications/" + applicationId + "/cv"))
            .andExpect(status().isUnauthorized());
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
            .andExpect(jsonPath("$.total").value(5)).andExpect(jsonPath("$.page").value(0));
    }

    @Test @org.springframework.transaction.annotation.Transactional
    void logoutRevokesExistingTokensAndProfileRestoresRealRecruiterName() throws Exception {
        String token=token("recruiter","RECLUTADOR");
        jdbc.update("INSERT INTO perfiles_contacto(usuario_id,nombres,apellidos,telefono) VALUES(102,'Nombre real','Reclutador','+51987654321')");
        mvc.perform(get("/api/auth/me").header("Authorization",token)).andExpect(status().isOk()).andExpect(jsonPath("$.nombres").value("Nombre real"));
        mvc.perform(post("/api/auth/logout").header("Authorization",token)).andExpect(status().isOk());
        mvc.perform(get("/api/recruiter/jobs").header("Authorization",token)).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/logout").header("Authorization",token)).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/logout")).andExpect(status().isUnauthorized());
    }

    @Test @org.springframework.transaction.annotation.Transactional
    void paginatedSearchRespectsFiltersAndRoles() throws Exception {
        jdbc.update("INSERT INTO postulantes(id,usuario_id,nombres,apellidos) VALUES(301,101,'Ana','Prueba')");
        jdbc.update("INSERT INTO departamentos(id,nombre) VALUES(301,'QA')");
        jdbc.update("INSERT INTO vacantes(id,titulo,departamento_id,reclutador_id,tipo_jornada,modalidad) VALUES(301,'Ventas',301,102,'full_time','presencial')");
        jdbc.update("INSERT INTO postulaciones(codigo,postulante_id,vacante_id) VALUES('QA-PAGE',301,301)");
        String auth=token("recruiter","RECLUTADOR");
        mvc.perform(get("/api/recruiter/applications/page").param("size","1").param("search","Ana").header("Authorization",auth)).andExpect(status().isOk()).andExpect(jsonPath("$.total").value(1)).andExpect(jsonPath("$.items[0].name").value("Ana Prueba"));
        mvc.perform(get("/api/recruiter/applications/page").param("state","aprobada").header("Authorization",auth)).andExpect(status().isOk()).andExpect(jsonPath("$.total").value(0));
        mvc.perform(get("/api/recruiter/applications/page").param("size","101").header("Authorization",auth)).andExpect(status().isBadRequest());
        mvc.perform(get("/api/recruiter/applications/page").header("Authorization",token("candidate","CANDIDATO"))).andExpect(status().isForbidden());
    }

    @Test @org.springframework.transaction.annotation.Transactional
    void passwordRecoveryHttpIsPrivateSingleUseAndRevokesOldJwt() throws Exception {
        String oldJwt = token("candidate", "CANDIDATO");
        var known = mvc.perform(post("/api/auth/password/request").contentType("application/json")
            .content("{\"email\":\"candidate@example.test\"}"))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        var unknown = mvc.perform(post("/api/auth/password/request").contentType("application/json")
            .content("{\"email\":\"unknown@example.test\"}"))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertEquals(known, unknown);
        var sent = org.mockito.ArgumentCaptor.forClass(org.springframework.mail.SimpleMailMessage.class);
        org.mockito.Mockito.verify(mail).send(sent.capture());
        String resetToken = sent.getValue().getText().split("#token=")[1].split("\\n")[0];
        String request = json.writeValueAsString(java.util.Map.of("token", resetToken, "password", "RecoveryFixture2026!"));
        mvc.perform(post("/api/auth/password/reset").contentType("application/json").content(request))
            .andExpect(status().isOk());
        mvc.perform(get("/api/profile").header("Authorization", oldJwt)).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/password/reset").contentType("application/json").content(request))
            .andExpect(status().isBadRequest());
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM recuperacion_acceso WHERE usuario_id=101", Integer.class));
    }
}
