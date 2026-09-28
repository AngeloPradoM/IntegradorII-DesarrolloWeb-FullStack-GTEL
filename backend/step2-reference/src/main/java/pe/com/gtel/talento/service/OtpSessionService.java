package pe.com.gtel.talento.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.util.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OtpSessionService {
    private final Map<String, State> sessions = new HashMap<>();
    private final SecureRandom random = new SecureRandom();
    private final int expiration, maxAttempts, cooldown, maxResends;
    private final String secret;
    private final Clock clock;

    @Autowired
    public OtpSessionService(
            @Value("${otp.expiration-seconds}") int expiration,
            @Value("${otp.max-attempts}") int maxAttempts,
            @Value("${otp.secret-salt}") String secret,
            @Value("${otp.resend-cooldown-seconds}") int cooldown,
            @Value("${otp.max-resends}") int maxResends) {
        this(expiration, maxAttempts, secret, cooldown, maxResends, Clock.systemUTC());
    }
    public OtpSessionService(int expiration, int maxAttempts, String secret, int cooldown, int maxResends, Clock clock) {
        if (secret == null || secret.length() < 32 || expiration < 1 || maxAttempts < 1 || cooldown < 0 || maxResends < 0)
            throw new IllegalArgumentException("Configuración OTP inválida; el secreto requiere al menos 32 caracteres");
        this.expiration = expiration; this.maxAttempts = maxAttempts; this.secret = secret;
        this.cooldown = cooldown; this.maxResends = maxResends; this.clock = clock;
    }
    public synchronized OtpSessionData createSession(String userId, String email, String role, String phone) {
        if (phone == null || !phone.matches("\\+[1-9][0-9]{7,14}"))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tu cuenta necesita un número de WhatsApp válido");
        Instant now = clock.instant();
        sessions.values().removeIf(s -> !now.isBefore(s.deadline));
        // Do not reset attempt/resend limits by repeating login.
        if (sessions.values().stream().anyMatch(s -> s.userId.equals(userId)))
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Ya hay una sesión OTP activa; úsala o espera a que expire");
        String id = UUID.randomUUID().toString();
        State state = new State(userId, email, role, phone, now.plusSeconds((long) expiration * (maxResends + 1)));
        sessions.put(id, state);
        return issue(id, state);
    }
    private OtpSessionData issue(String id, State state) {
        String code;
        byte[] hash;
        do {
            code = String.valueOf(100000 + random.nextInt(900000));
            hash = hash(id, code);
        } while (state.hash != null && MessageDigest.isEqual(hash, state.hash));
        state.hash = hash;
        state.expires = clock.instant().plusSeconds(expiration);
        state.resendAt = clock.instant().plusSeconds(cooldown);
        return new OtpSessionData(id, "OTP_REQUIRED", code, state.phone,
                "******" + state.phone.substring(state.phone.length() - 4), expiration, cooldown);
    }
    public synchronized VerificationResult verifyOtp(String id, String code) {
        State state = sessions.get(id);
        if (state == null || state.used) return new VerificationResult(false, "LOGIN_REQUIRED");
        if (state.attempts >= maxAttempts) return new VerificationResult(false, "OTP_LOCKED");
        if (!clock.instant().isBefore(state.expires) || !clock.instant().isBefore(state.deadline))
            return new VerificationResult(false, "OTP_EXPIRED");
        state.attempts++;
        if (code == null || !code.matches("[0-9]{6}") || !MessageDigest.isEqual(state.hash, hash(id, code)))
            return new VerificationResult(false, state.attempts >= maxAttempts ? "OTP_LOCKED" : "OTP_INVALID");
        state.used = true;
        state.hash = null;
        return new VerificationResult(true, "AUTHENTICATED");
    }
    public synchronized OtpSessionData resendOtp(String id) {
        State state = sessions.get(id);
        if (state == null || state.used || !clock.instant().isBefore(state.deadline))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesión expirada; inicia sesión de nuevo");
        if (state.attempts >= maxAttempts || state.resends >= maxResends)
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Límite de intentos o reenvíos alcanzado");
        if (clock.instant().isBefore(state.resendAt))
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Espera antes de reenviar el código");
        state.resends++;
        return issue(id, state);
    }
    public synchronized boolean invalidateSession(String id) { return sessions.remove(id) != null; }
    public synchronized Optional<String> getEmail(String id) {
        State s = sessions.get(id); return s == null ? Optional.empty() : Optional.of(s.email);
    }
    public synchronized Optional<String> getRole(String id) {
        State s = sessions.get(id); return s == null ? Optional.empty() : Optional.of(s.role);
    }
    private byte[] hash(String id, String code) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return mac.doFinal((id + ":" + code).getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) { throw new IllegalStateException("No se pudo proteger el OTP"); }
    }
    public record VerificationResult(boolean verified, String status) {}
    // Internal delivery data only; never serialize or log.
    public record OtpSessionData(String sessionId, String status, String otpCode, String recipientPhone,
                                 String maskedPhone, long expiresInSeconds, long resendAfterSeconds) {
        @Override public String toString() { return "OtpSessionData[redacted]"; }
    }
    private static class State {
        final String userId, email, role, phone;
        final Instant deadline;
        byte[] hash;
        Instant expires, resendAt;
        int attempts, resends;
        boolean used;
        State(String userId, String email, String role, String phone, Instant deadline) {
            this.userId = userId; this.email = email; this.role = role; this.phone = phone; this.deadline = deadline;
        }
    }
}
