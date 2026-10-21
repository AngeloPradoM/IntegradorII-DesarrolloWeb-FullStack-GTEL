package pe.com.gtel.talento.security.ratelimit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class RateLimitingServiceTest {

    private RateLimitingService rateLimitingService;

    @BeforeEach
    void setUp() {
        rateLimitingService = new RateLimitingService();
        rateLimitingService.clearAll();
    }

    @Test
    void allowsRequestsWithinPolicyLimits() {
        String clientIp = "192.168.1.100";
        var first = rateLimitingService.check(clientIp, "LOGIN");

        assertTrue(first.allowed());
        assertEquals(10, first.limit());
        assertEquals(9, first.remaining());
        assertEquals(0, first.retryAfterSeconds());
    }

    @Test
    void blocksRequestsWhenLimitIsExceeded() {
        String clientIp = "192.168.1.200";
        // Límite de OTP es 5 por minuto
        for (int i = 0; i < 5; i++) {
            var res = rateLimitingService.check(clientIp, "OTP");
            assertTrue(res.allowed(), "Petición " + (i + 1) + " debe ser permitida");
        }

        // Intento 6 debe ser bloqueado con HTTP 429 semantics
        var blocked = rateLimitingService.check(clientIp, "OTP");
        assertFalse(blocked.allowed());
        assertEquals(0, blocked.remaining());
        assertTrue(blocked.retryAfterSeconds() > 0);
    }

    @Test
    void resetClearsBucketForClient() {
        String clientIp = "192.168.1.300";
        for (int i = 0; i < 5; i++) {
            rateLimitingService.check(clientIp, "OTP");
        }
        assertFalse(rateLimitingService.check(clientIp, "OTP").allowed());

        rateLimitingService.reset(clientIp, "OTP");

        var afterReset = rateLimitingService.check(clientIp, "OTP");
        assertTrue(afterReset.allowed());
        assertEquals(4, afterReset.remaining());
    }
}
