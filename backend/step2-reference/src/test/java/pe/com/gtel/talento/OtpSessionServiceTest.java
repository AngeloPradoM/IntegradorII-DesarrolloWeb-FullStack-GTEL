package pe.com.gtel.talento;

import static org.junit.jupiter.api.Assertions.*;
import java.time.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import pe.com.gtel.talento.service.OtpSessionService;

class OtpSessionServiceTest {
    static class MutableClock extends Clock {
        Instant now = Instant.parse("2026-01-01T00:00:00Z");
        public ZoneId getZone() { return ZoneOffset.UTC; }
        public Clock withZone(ZoneId zone) { return this; }
        public Instant instant() { return now; }
        void advance(int seconds) { now = now.plusSeconds(seconds); }
    }
    final MutableClock clock = new MutableClock();
    final OtpSessionService service = new OtpSessionService(300, 5, "test-secret-at-least-32-characters", 30, 3, clock);
    OtpSessionService.OtpSessionData create() {
        return service.createSession("1", "test@example.com", "CANDIDATO", "+51987654321");
    }
    @Test void generatesSixDigitsAndConsumesOnlyOnce() {
        var s = create();
        assertTrue(s.otpCode().matches("[0-9]{6}"));
        assertEquals("******4321", s.maskedPhone());
        assertFalse(s.toString().contains(s.otpCode()));
        assertTrue(service.verifyOtp(s.sessionId(), s.otpCode()).verified());
        assertFalse(service.verifyOtp(s.sessionId(), s.otpCode()).verified());
        assertThrows(ResponseStatusException.class, () -> service.resendOtp(s.sessionId()));
    }
    @Test void expiresAtDeadlineAndAllowsFreshResend() {
        var s = create(); clock.advance(300);
        assertEquals("OTP_EXPIRED", service.verifyOtp(s.sessionId(), s.otpCode()).status());
        var next = service.resendOtp(s.sessionId());
        assertEquals(s.recipientPhone(), next.recipientPhone());
        assertNotEquals(s.otpCode(), next.otpCode());
        assertFalse(service.verifyOtp(s.sessionId(), s.otpCode()).verified());
        assertTrue(service.verifyOtp(s.sessionId(), next.otpCode()).verified());
    }
    @Test void limitsResendsAndEnforcesCooldown() {
        var s = create();
        assertThrows(ResponseStatusException.class, () -> service.resendOtp(s.sessionId()));
        for (int i=0; i<3; i++) { clock.advance(30); service.resendOtp(s.sessionId()); }
        clock.advance(30);
        assertThrows(ResponseStatusException.class, () -> service.resendOtp(s.sessionId()));
    }
    @Test void resendAndRepeatedLoginCannotResetAttempts() {
        var s=create();
        for (int i=0; i<4; i++) assertFalse(service.verifyOtp(s.sessionId(), "000000").verified());
        clock.advance(30); var next=service.resendOtp(s.sessionId());
        assertEquals("OTP_LOCKED",service.verifyOtp(s.sessionId(),"000000").status());
        assertFalse(service.verifyOtp(s.sessionId(),next.otpCode()).verified());
        assertThrows(ResponseStatusException.class,this::create);
        assertThrows(ResponseStatusException.class,()->service.resendOtp(s.sessionId()));
    }
    @Test void cannotUseCodeAcrossSessions() {
        var s=create();
        var other=service.createSession("2","other@example.com","CANDIDATO","+51911112222");
        assertEquals("******2222",other.maskedPhone());
        assertFalse(service.verifyOtp("unknown", s.otpCode()).verified());
        assertEquals("+51987654321",s.recipientPhone());
    }
    @Test void concurrentVerificationOnlySucceedsOnce() throws Exception {
        var s=create();
        try (var pool=Executors.newFixedThreadPool(2)) {
            var results=pool.invokeAll(java.util.List.of(
                () -> service.verifyOtp(s.sessionId(),s.otpCode()).verified(),
                () -> service.verifyOtp(s.sessionId(),s.otpCode()).verified()));
            int successes=0;
            for (var result:results) if (Boolean.TRUE.equals(result.get())) successes++;
            assertEquals(1,successes);
        }
    }
    @Test void rejectsMissingPhoneAndWeakSecret() {
        assertThrows(ResponseStatusException.class,()->service.createSession("1","a","CANDIDATO",null));
        assertThrows(IllegalArgumentException.class,()->new OtpSessionService(300,5,"",30,3));
    }
}
