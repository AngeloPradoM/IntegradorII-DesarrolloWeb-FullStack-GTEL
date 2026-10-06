package pe.com.gtel.talento.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.*;
import org.springframework.aop.framework.ProxyFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.*;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.transaction.annotation.AnnotationTransactionAttributeSource;
import org.springframework.transaction.interceptor.TransactionInterceptor;
import org.springframework.web.server.ResponseStatusException;
import pe.com.gtel.talento.auth.repository.PasswordRecoveryRepository;
import pe.com.gtel.talento.auth.service.PasswordRecoveryService;
import pe.com.gtel.talento.identity.repository.WorkflowIdentityRepository;
import pe.com.gtel.talento.identity.service.WorkflowIdentity;
import pe.com.gtel.talento.notification.repository.NotificationRepository;
import pe.com.gtel.talento.notification.service.NotificationService;
import pe.com.gtel.talento.profile.dto.ProfileRequest;
import pe.com.gtel.talento.profile.repository.ProfileRepository;
import pe.com.gtel.talento.profile.service.ProfileService;
import pe.com.gtel.talento.recruitment.application.dto.ApplicationPersonalRequest;
import pe.com.gtel.talento.recruitment.application.repository.ApplicationRepository;
import pe.com.gtel.talento.recruitment.application.service.ApplicationService;
import pe.com.gtel.talento.recruitment.evaluation.dto.EvaluationCriterionRequest;
import pe.com.gtel.talento.recruitment.evaluation.dto.EvaluationRequest;
import pe.com.gtel.talento.recruitment.evaluation.repository.EvaluationRepository;
import pe.com.gtel.talento.recruitment.evaluation.service.EvaluationService;
import pe.com.gtel.talento.recruitment.interview.dto.InterviewRequest;
import pe.com.gtel.talento.recruitment.interview.repository.InterviewRepository;
import pe.com.gtel.talento.recruitment.interview.service.InterviewService;
import pe.com.gtel.talento.recruitment.job.dto.JobRequest;
import pe.com.gtel.talento.recruitment.job.repository.JobRepository;
import pe.com.gtel.talento.recruitment.job.repository.JobTrashRepository;
import pe.com.gtel.talento.recruitment.job.service.JobService;
import pe.com.gtel.talento.recruitment.job.service.JobTrashService;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class WorkflowTest {
    JdbcTemplate jdbc;
    DriverManagerDataSource ds;
    WorkflowIdentity identity;
    ApplicationService applications;
    JobService jobs;
    InterviewService interviews;
    EvaluationService evaluations;
    NotificationService notifications;
    JavaMailSender mail;
    long job;
    <T> T transactional(T target){var proxy=new ProxyFactory(target);proxy.setProxyTargetClass(true);proxy.addAdvice(new TransactionInterceptor(new DataSourceTransactionManager(ds),new AnnotationTransactionAttributeSource()));return (T)proxy.getProxy();}
    @BeforeEach void setup() throws Exception {
        ds=new DriverManagerDataSource("jdbc:h2:mem:"+UUID.randomUUID()+";MODE=MySQL;DB_CLOSE_DELAY=-1","sa","");jdbc=new JdbcTemplate(ds);
        String schema=Files.readString(Path.of("database/schema/gtel_talento.sql"));
        schema=schema.replaceAll("(?m)--[^\\r\\n]*","").replaceAll("(?is)CREATE DATABASE IF NOT EXISTS.*?;","")
            .replaceAll("(?i)USE gtel_talento;","").replaceAll("(?i) ENGINE=InnoDB","");
        for(String sql:schema.split(";"))if(!sql.isBlank())jdbc.execute(sql);
        jdbc.update("INSERT INTO usuarios(id,email,password_hash,rol_id,estado) VALUES(10,'recruiter@test.example','hash',2,'activo'),(11,'a@test.example','hash',1,'activo'),(12,'b@test.example','hash',1,'activo')");
        jdbc.update("INSERT INTO postulantes(usuario_id,nombres,apellidos) VALUES(11,'Ana','Test'),(12,'Bea','Test')");
        identity=new WorkflowIdentity(new WorkflowIdentityRepository(jdbc), new pe.com.gtel.talento.audit.service.AuditService(new pe.com.gtel.talento.audit.repository.AuditRepository(jdbc)));mail=mock(JavaMailSender.class);notifications=transactional(new NotificationService(new NotificationRepository(jdbc),mail,"sender@test.example"));
        applications=transactional(new ApplicationService(new ApplicationRepository(jdbc),identity,notifications,new ObjectMapper()));jobs=transactional(new JobService(new JobRepository(jdbc),identity));interviews=transactional(new InterviewService(new InterviewRepository(jdbc),identity,applications,notifications));evaluations=transactional(new EvaluationService(new EvaluationRepository(jdbc),identity,applications));
        job=((Number)jobs.save(null,jobRequest("activa"),"recruiter@test.example").get("id")).longValue();
    }
    JobRequest jobRequest(String state){return new JobRequest("Ventas","Descripción","Ventas","Lima","full_time","presencial",BigDecimal.valueOf(1000),BigDecimal.valueOf(2000),2,state,LocalDate.now().plusDays(20),"Secundaria","Sin experiencia",List.of("Ventas"));}
    MockMultipartFile cv(){return new MockMultipartFile("cv","cv.pdf","application/pdf","%PDF-1.4\nfixture\n%%EOF".getBytes(StandardCharsets.US_ASCII));}
    ApplicationPersonalRequest personal(){return new ApplicationPersonalRequest("Ana","Test","12345678","+51987654321","Lima","Interés");}
    long apply(){return ((Number)applications.apply(job,personal(),true,cv(),"a@test.example").get("id")).longValue();}
    @Test void appliesOnceStoresPdfAndEnforcesOwnership() throws Exception {
        long id=apply();assertArrayEquals(cv().getBytes(),applications.document(id,"a@test.example"));
        assertEquals("DNI",jdbc.queryForObject("SELECT tipo_documento FROM postulantes WHERE usuario_id=11",String.class));
        assertEquals("12345678",jdbc.queryForObject("SELECT numero_documento FROM postulantes WHERE usuario_id=11",String.class));
        assertEquals("12345678",applications.list("recruiter@test.example",true).getFirst().get("dni"));
        assertThrows(ResponseStatusException.class,()->applications.document(id,"b@test.example"));
        assertDoesNotThrow(()->applications.document(id,"recruiter@test.example"));
        assertThrows(ResponseStatusException.class,()->applications.apply(job,personal(),true,cv(),"a@test.example"));
        assertEquals(1,jdbc.queryForObject("SELECT COUNT(*) FROM postulaciones",Integer.class));
        assertEquals(0,applications.list("b@test.example",false).size());
    }
    @Test void rejectsClosedJobsAndInvalidFilesWithoutPartialWrites(){
        assertEquals(404,assertThrows(ResponseStatusException.class,()->applications.apply(Long.MAX_VALUE,personal(),true,cv(),"a@test.example")).getStatusCode().value());
        assertThrows(ResponseStatusException.class,()->applications.apply(job,personal(),true,new MockMultipartFile("cv","fake.pdf","application/pdf","html".getBytes()),"a@test.example"));
        jobs.save(job,jobRequest("cerrada"),"recruiter@test.example");
        assertEquals(0,jobs.list(true).size());
        assertThrows(ResponseStatusException.class,()->applications.apply(job,personal(),true,cv(),"a@test.example"));
        assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM postulaciones",Integer.class));
    }
    @Test void rollbackWhenDocumentPersistenceFails(){
        jdbc.execute("DROP TABLE documentos_postulacion"); // Disposable H2 only.
        assertThrows(RuntimeException.class,()->apply());
        assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM postulaciones",Integer.class));
    }
    @Test void transitionsHaveHistoryAndCandidateCannotChangeThem(){
        long id=apply();assertThrows(ResponseStatusException.class,()->applications.status(id,"entrevista","a@test.example"));
        applications.status(id,"entrevista","recruiter@test.example");
        assertEquals(2,jdbc.queryForObject("SELECT COUNT(*) FROM postulacion_timeline",Integer.class));
        assertEquals(2,jdbc.queryForObject("SELECT COUNT(*) FROM notificaciones",Integer.class));
        applications.status(id,"aprobada","recruiter@test.example");
        assertThrows(ResponseStatusException.class,()->applications.status(id,"recibida","recruiter@test.example"));
    }
    @Test void interviewConflictsAndEvaluationPersist(){
        long id=apply();var date=LocalDate.now().plusDays(2);
        interviews.interview(null,new InterviewRequest(id,date,LocalTime.of(10,0),30,"video","Enlace","programada"),"recruiter@test.example");
        assertThrows(ResponseStatusException.class,()->interviews.interview(null,new InterviewRequest(id,date,LocalTime.of(10,15),30,"video","Enlace","programada"),"recruiter@test.example"));
        var result=evaluations.evaluate(new EvaluationRequest(id,"Técnica",30,"aprobado",List.of(new EvaluationCriterionRequest("Técnica",80,""),new EvaluationCriterionRequest("Comunicación",100,""))),"recruiter@test.example");
        assertEquals(90,((Number)result.get("score")).intValue());assertEquals(2,jdbc.queryForObject("SELECT COUNT(*) FROM evaluacion_detalle",Integer.class));
    }
    @Test void profilePersistsAndRejectsUnsafePhoto(){
        var profile=transactional(new ProfileService(new ProfileRepository(jdbc),identity));
        profile.save("a@test.example",new ProfileRequest("Ana","Test","+51987654321","Lima","Miraflores","","","Ingeniería","Ventas"));
        assertEquals("Ingeniería",profile.get("a@test.example").get("educacion"));
        assertThrows(ResponseStatusException.class,()->profile.save("a@test.example",new ProfileRequest("Ana","Test","+51987654321","Lima","","","data:image/svg+xml;base64,AAAA","","")));
    }
    @Test void recoveryHashesTokenRevokesSessionsAndCannotBeReused(){
        var encoder=new BCryptPasswordEncoder(4);var service=transactional(new PasswordRecoveryService(new PasswordRecoveryRepository(jdbc),mail,encoder,"sender@test.example","https://example.test/recuperar-acceso"));
        var sent=org.mockito.ArgumentCaptor.forClass(SimpleMailMessage.class);
        service.request("a@test.example");verify(mail).send(sent.capture());String token=sent.getValue().getText().split("#token=")[1].split("\\n")[0];
        assertNotEquals(token,jdbc.queryForObject("SELECT token_hash FROM recuperacion_acceso",String.class));
        service.request("a@test.example");verify(mail,times(1)).send(any(SimpleMailMessage.class));
        service.reset(token,"NewPassword2026!");
        assertTrue(encoder.matches("NewPassword2026!",jdbc.queryForObject("SELECT password_hash FROM usuarios WHERE id=11",String.class)));
        assertEquals(1,jdbc.queryForObject("SELECT auth_version FROM usuarios WHERE id=11",Integer.class));
        assertThrows(ResponseStatusException.class,()->service.reset(token,"AnotherPassword2026!"));
    }
    @Test void notificationFailureIsRetainedForRetry(){
        apply();doThrow(new org.springframework.mail.MailSendException("simulated")).when(mail).send(any(SimpleMailMessage.class));
        notifications.deliverOne();assertEquals(false,jdbc.queryForObject("SELECT enviada FROM notificaciones",Boolean.class));
        assertEquals(1,jdbc.queryForObject("SELECT intentos FROM notificaciones",Integer.class));
        assertEquals(1,jdbc.queryForObject("SELECT COUNT(*) FROM postulaciones",Integer.class));
    }
    @Test void jobsRetainRequirementsAndCanBePausedPublishedAndClosed(){
        assertEquals(List.of("Ventas"),jobs.get(job,true).get("tags"));
        assertEquals("Secundaria",jobs.get(job,true).get("education"));
        assertThrows(ResponseStatusException.class,()->jobs.save(job,jobRequest("cerrada"),"a@test.example"));
        jobs.save(job,jobRequest("pausada"),"recruiter@test.example");
        assertTrue(jobs.list(true).isEmpty());
        jobs.save(job,jobRequest("activa"),"recruiter@test.example");
        assertEquals(1,jobs.list(true).size());
        jobs.save(job,jobRequest("cerrada"),"recruiter@test.example");
        assertNotNull(jdbc.queryForObject("SELECT fecha_cierre FROM vacantes WHERE id=?",java.sql.Date.class,job));
    }
    @Test void recoveryRejectsExpiredLinksAndMailFailureWithoutChangingPassword(){
        var service=transactional(new PasswordRecoveryService(new PasswordRecoveryRepository(jdbc),mail,new BCryptPasswordEncoder(4),"sender@test.example","https://example.test/recuperar-acceso"));
        service.request("unknown@test.example");verifyNoInteractions(mail);
        service.request("a@test.example");
        var sent=org.mockito.ArgumentCaptor.forClass(SimpleMailMessage.class);verify(mail).send(sent.capture());
        String token=sent.getValue().getText().split("#token=")[1].split("\\n")[0];
        jdbc.update("UPDATE recuperacion_acceso SET expira=0 WHERE usuario_id=11");
        assertThrows(ResponseStatusException.class,()->service.reset(token,"NewPassword2026!"));
        assertEquals("hash",jdbc.queryForObject("SELECT password_hash FROM usuarios WHERE id=11",String.class));
        doThrow(new org.springframework.mail.MailSendException("simulated")).when(mail).send(any(SimpleMailMessage.class));
        assertDoesNotThrow(()->service.request("b@test.example"));
        assertEquals(0L,jdbc.queryForObject("SELECT expira FROM recuperacion_acceso WHERE usuario_id=12",Long.class));
    }
    @Test void interviewCanBeRescheduledAndCancelledWithNotifications(){
        long application=apply();var date=LocalDate.now().plusDays(2);
        long id=((Number)interviews.interview(null,new InterviewRequest(application,date,LocalTime.of(10,0),30,"video","Sala virtual","programada"),"recruiter@test.example").get("id")).longValue();
        interviews.interview(id,new InterviewRequest(application,date.plusDays(1),LocalTime.of(11,0),45,"presencial","Oficina","programada"),"recruiter@test.example");
        assertEquals(date.plusDays(1).toString(),interviews.interviews().getFirst().get("date"));
        interviews.interview(id,new InterviewRequest(application,date.plusDays(1),LocalTime.of(11,0),45,"presencial","Oficina","cancelada"),"recruiter@test.example");
        assertEquals("cancelada",interviews.interviews().getFirst().get("status"));
        assertEquals(4,notifications.list(11).size());
    }
    @Test void notificationsArePrivateAndSuccessfulDeliveryIsNotRepeated(){
        apply();long id=((Number)notifications.list(11).getFirst().get("id")).longValue();
        assertTrue(notifications.list(12).isEmpty());
        notifications.read(id,12);assertEquals(false,notifications.list(11).getFirst().get("leida"));
        notifications.read(id,11);assertEquals(true,notifications.list(11).getFirst().get("leida"));
        notifications.deliverOne();notifications.deliverOne();verify(mail,times(1)).send(any(SimpleMailMessage.class));
        assertEquals(true,jdbc.queryForObject("SELECT enviada FROM notificaciones WHERE id=?",Boolean.class,id));
    }
    @Test void trashHidesJobAndRestoresItWithoutLosingApplications(){
        long application=apply();var trash=transactional(new JobTrashService(new JobTrashRepository(jdbc),identity));
        assertThrows(ResponseStatusException.class,()->trash.trash(job,"a@test.example"));
        trash.trash(job,"recruiter@test.example");
        long expiry=jdbc.queryForObject("SELECT eliminar_despues FROM vacantes_papelera",Long.class);
        trash.trash(job,"recruiter@test.example");
        assertEquals(expiry,jdbc.queryForObject("SELECT eliminar_despues FROM vacantes_papelera",Long.class));
        assertTrue(jobs.list(true).isEmpty());assertTrue(jobs.list(false).isEmpty());
        assertThrows(ResponseStatusException.class,()->jobs.save(job,jobRequest("activa"),"recruiter@test.example"));
        trash.purgeExpired();assertEquals(1,trash.list().size());
        trash.restore(job,"recruiter@test.example");
        assertEquals("pausada",jobs.get(job,false).get("status"));
        assertNotNull(applications.get(application,"a@test.example"));
    }
    @Test void deletedDevelopmentAccountsAreNotRecreatedOnRestart(){
        var seeds=new pe.com.gtel.talento.bootstrap.DevelopmentAccounts(new pe.com.gtel.talento.bootstrap.repository.DevelopmentAccountRepository(jdbc),new BCryptPasswordEncoder(4));
        seeds.run();
        long id=jdbc.queryForObject("SELECT id FROM usuarios WHERE email='postulante1@gmail.com'",Long.class);
        transactional(new pe.com.gtel.talento.admin.service.AdminUserDeletionService(new pe.com.gtel.talento.admin.repository.AdminUserDeletionRepository(jdbc))).delete(id,"administrador@gmail.com");
        seeds.run();
        assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM usuarios WHERE email='postulante1@gmail.com'",Integer.class));
    }
    @Test void deletesCandidateDataAndPreservesAuditIdentity(){
        jdbc.update("INSERT INTO usuarios(id,email,password_hash,rol_id,estado) VALUES(20,'admin@test.example','hash',3,'activo')");
        long application=apply();
        interviews.interview(null,new InterviewRequest(application,LocalDate.now().plusDays(2),LocalTime.of(10,0),30,"video","Sala","programada"),"recruiter@test.example");
        evaluations.evaluate(new EvaluationRequest(application,"Técnica",30,"aprobado",List.of(new EvaluationCriterionRequest("Criterio",90,""))),"recruiter@test.example");
        var deletion=transactional(new pe.com.gtel.talento.admin.service.AdminUserDeletionService(new pe.com.gtel.talento.admin.repository.AdminUserDeletionRepository(jdbc)));
        deletion.delete(11,"admin@test.example");
        assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM usuarios WHERE id=11",Integer.class));
        for(String table:List.of("postulaciones","documentos_postulacion","entrevistas","evaluaciones","evaluacion_detalle","postulacion_timeline","notificaciones"))assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM "+table,Integer.class));
        assertEquals("a@test.example",jdbc.queryForObject("SELECT actor_email_historico FROM auditoria WHERE actor_id_historico=11",String.class));
        assertEquals(1,jdbc.queryForObject("SELECT COUNT(*) FROM auditoria WHERE tabla_afectada='usuarios' AND registro_id=11 AND accion='eliminar' AND usuario_id=20",Integer.class));
        assertEquals(1,jobs.list(true).size());
    }
    @Test void protectsSelfAndTransfersRecruiterWorkAndRollsBackFailures(){
        jdbc.update("INSERT INTO usuarios(id,email,password_hash,rol_id,estado) VALUES(20,'admin@test.example','hash',3,'activo')");
        var deletion=transactional(new pe.com.gtel.talento.admin.service.AdminUserDeletionService(new pe.com.gtel.talento.admin.repository.AdminUserDeletionRepository(jdbc)));
        assertThrows(ResponseStatusException.class,()->deletion.delete(20,"admin@test.example"));
        assertThrows(ResponseStatusException.class,()->deletion.delete(11,"recruiter@test.example"));
        long application=apply();
        deletion.delete(10,"admin@test.example");
        assertEquals(20L,jdbc.queryForObject("SELECT reclutador_id FROM vacantes WHERE id=?",Long.class,job));
        assertNotNull(applications.get(application,"a@test.example"));
        jdbc.execute("DROP TABLE recuperacion_acceso");
        assertThrows(RuntimeException.class,()->deletion.delete(11,"admin@test.example"));
        assertNotNull(applications.get(application,"a@test.example"));
        assertEquals(1,jdbc.queryForObject("SELECT COUNT(*) FROM documentos_postulacion",Integer.class));
    }
    @Test void expiredTrashDeletesOnlyTheJobAndItsDependentRecords(){
        long application=apply();var trash=transactional(new JobTrashService(new JobTrashRepository(jdbc),identity));
        interviews.interview(null,new InterviewRequest(application,LocalDate.now().plusDays(2),LocalTime.of(10,0),30,"video","Sala","programada"),"recruiter@test.example");
        evaluations.evaluate(new EvaluationRequest(application,"Técnica",30,"aprobado",List.of(new EvaluationCriterionRequest("Criterio",90,""))),"recruiter@test.example");
        long other=((Number)jobs.save(null,jobRequest("activa"),"recruiter@test.example").get("id")).longValue();
        trash.trash(job,"recruiter@test.example");
        jdbc.update("UPDATE vacantes_papelera SET eliminar_despues=? WHERE vacante_id=?",System.currentTimeMillis()-1,job);
        assertThrows(ResponseStatusException.class,()->trash.restore(job,"recruiter@test.example"));
        trash.purgeExpired();
        for(String table:List.of("postulaciones","documentos_postulacion","entrevistas","evaluaciones","evaluacion_detalle","postulacion_timeline","vacantes_papelera"))
            assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM "+table,Integer.class));
        assertEquals(other,((Number)jobs.get(other,true).get("id")).longValue());
        assertEquals(3,jdbc.queryForObject("SELECT COUNT(*) FROM usuarios",Integer.class));
        assertEquals(1,jdbc.queryForObject("SELECT COUNT(*) FROM auditoria WHERE accion='eliminar'",Integer.class));
    }
}
