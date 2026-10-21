package pe.com.gtel.talento.auth.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.time.*;
import java.util.Map;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.*;
import org.springframework.aop.framework.ProxyFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.transaction.annotation.AnnotationTransactionAttributeSource;
import org.springframework.transaction.interceptor.TransactionInterceptor;
import org.springframework.web.server.ResponseStatusException;
import pe.com.gtel.talento.auth.dto.AuthResponse;
import pe.com.gtel.talento.auth.repository.OtpRepository;
import pe.com.gtel.talento.mail.VerificationMailService;

class EmailOtpServiceTest {
    final VerificationMailService mail=mock(VerificationMailService.class);
    final CandidatoService accounts=mock(CandidatoService.class);
    final Clock clock=mock(Clock.class);
    final AtomicReference<String> sentCode=new AtomicReference<>();
    final AuthResponse user=new AuthResponse(1L,"Test","User","test@example.test","CANDIDATO",null);
    EmailOtpService service;
    JdbcTemplate jdbc;
    OtpRepository repository;
    long now=1_000_000;

    @BeforeEach void setup() throws Exception {
        var ds=new DriverManagerDataSource("jdbc:h2:mem:"+java.util.UUID.randomUUID()+";MODE=MySQL;DB_CLOSE_DELAY=-1","sa","");
        jdbc=new JdbcTemplate(ds);
        jdbc.execute("CREATE TABLE usuarios (id BIGINT PRIMARY KEY)");
        jdbc.update("INSERT INTO usuarios VALUES(1)");
        String sql=java.nio.file.Files.readString(java.nio.file.Path.of("database/migrations/002_email_otp.sql"));
        jdbc.execute(sql.substring(sql.indexOf("CREATE TABLE")).replace(" ENGINE=InnoDB", ""));
        repository=new OtpRepository(jdbc);
        when(clock.millis()).thenAnswer(i->now);
        when(accounts.obtenerPerfil(user.email())).thenReturn(user);
        doAnswer(i->{sentCode.set(i.getArgument(1));return null;}).when(mail).send(eq(user.email()),anyString());
        var target=new EmailOtpService(repository,mail,accounts,"test-only-secret-at-least-32-bytes-long",clock);
        var proxy=new ProxyFactory(target);
        proxy.setProxyTargetClass(true);
        proxy.addAdvice(new TransactionInterceptor(new DataSourceTransactionManager(ds),new AnnotationTransactionAttributeSource()));
        service=(EmailOtpService)proxy.getProxy();
    }
    String start() { return (String)service.start(user).get("sessionId"); }
    String wrong() { return sentCode.get().equals("000000")?"111111":"000000"; }

    @Test void resendBecomesAvailableAtThirtySeconds() {
        var response=service.start(user);
        assertEquals(30,response.get("resendAfterSeconds"));
        String id=(String)response.get("sessionId");
        now+=29_999;
        assertThrows(ResponseStatusException.class,()->service.resend(id));
        now++;
        assertEquals(30,service.resend(id).get("resendAfterSeconds"));
        verify(mail,times(2)).send(eq(user.email()),anyString());
    }

    @Test void hashOnlyStoredAndCodeCannotBeReused() {
        String id=start();
        assertTrue(sentCode.get().matches("[0-9]{6}"));
        var c=repository.bySession(id).orElseThrow();
        assertNotEquals(sentCode.get(),c.hash());
        assertEquals(64,c.hash().length());
        assertEquals(user,service.verify(id,sentCode.get()));
        assertThrows(ResponseStatusException.class,()->service.verify(id,sentCode.get()));
    }
    @Test void wrongAttemptsCommitAndCannotBeResetByResendOrLogin() {
        String id=start();
        for(int i=0;i<5;i++) assertThrows(ResponseStatusException.class,()->service.verify(id,wrong()));
        assertEquals(5,repository.bySession(id).orElseThrow().attempts());
        now+=61_000;
        assertThrows(ResponseStatusException.class,()->service.resend(id));
        assertThrows(ResponseStatusException.class,()->service.start(user));
        assertThrows(ResponseStatusException.class,()->service.verify(id,sentCode.get()));
    }
    @Test void expiryCooldownResendAndUnknownSession() {
        String id=start();
        String oldCode=sentCode.get();
        assertThrows(ResponseStatusException.class,()->service.resend(id));
        now+=300_000;
        assertThrows(ResponseStatusException.class,()->service.verify(id,oldCode));
        service.resend(id);
        assertNotEquals(oldCode,sentCode.get());
        assertThrows(ResponseStatusException.class,()->service.verify(id,oldCode));
        assertEquals(user,service.verify(id,sentCode.get()));
        assertThrows(ResponseStatusException.class,()->service.verify(java.util.UUID.randomUUID().toString(),"123456"));
    }
    @Test void resendsHaveFixedBudgetAndDeadline() {
        String id=start();
        for(int i=0;i<3;i++){now+=30_000;service.resend(id);}
        now+=30_000;
        assertThrows(ResponseStatusException.class,()->service.resend(id));
        assertThrows(ResponseStatusException.class,()->service.start(user));
        now+=600_000;
        assertThrows(ResponseStatusException.class,()->service.verify(id,sentCode.get()));
        assertNotEquals(id,start());
    }
    @Test void smtpFailureInvalidatesChallengeAndPersistsCooldown() {
        doThrow(new IllegalStateException("SMTP failure")).when(mail).send(anyString(),anyString());
        var error=assertThrows(ResponseStatusException.class,()->service.start(user));
        assertEquals(503,error.getStatusCode().value());
        var c=repository.byUser(1).orElseThrow();
        assertTrue(c.consumed());
        assertEquals("",c.hash());
        assertThrows(ResponseStatusException.class,()->service.start(user));
    }
    @Test void concurrentVerificationAllowsExactlyOneSuccess() throws Exception {
        String id=start(), code=sentCode.get();
        var pool=Executors.newFixedThreadPool(2);
        try {
            Callable<Boolean> attempt=()->{try{service.verify(id,code);return true;}catch(ResponseStatusException e){return false;}};
            var results=pool.invokeAll(java.util.List.of(attempt,attempt));
            int successes=0;
            for(var result:results) if(result.get())successes++;
            assertEquals(1,successes);
        } finally {pool.shutdownNow();}
    }
    @Test void roleChangePreventsAuthentication() {
        String id=start();
        when(accounts.obtenerPerfil(user.email())).thenReturn(new AuthResponse(1L,"Test","User",user.email(),"RECLUTADOR",null));
        assertThrows(ResponseStatusException.class,()->service.verify(id,sentCode.get()));
    }
}
