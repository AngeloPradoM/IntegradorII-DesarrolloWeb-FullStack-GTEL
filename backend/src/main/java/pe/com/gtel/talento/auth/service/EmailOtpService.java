package pe.com.gtel.talento.auth.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Clock;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import pe.com.gtel.talento.auth.dto.AuthResponse;
import pe.com.gtel.talento.auth.repository.OtpRepository;
import pe.com.gtel.talento.auth.repository.OtpRepository.Challenge;
import pe.com.gtel.talento.mail.VerificationMailService;

@Service
@Transactional(noRollbackFor = ResponseStatusException.class)
public class EmailOtpService {
    private static final Logger log = LoggerFactory.getLogger(EmailOtpService.class);
    private final OtpRepository repository;
    private final VerificationMailService mail;
    private final CandidatoService accounts;
    private final String secret;
    private final Clock clock;
    private final SecureRandom random = new SecureRandom();

    @Autowired
    public EmailOtpService(OtpRepository repository, VerificationMailService mail,
            CandidatoService accounts, @Value("${otp.hash-secret}") String secret) {
        this(repository, mail, accounts, secret, Clock.systemUTC());
    }
    EmailOtpService(OtpRepository repository, VerificationMailService mail, CandidatoService accounts,
            String secret, Clock clock) {
        if (secret.getBytes(StandardCharsets.UTF_8).length < 32) throw new IllegalArgumentException("OTP secret demasiado corto");
        this.repository=repository; this.mail=mail; this.accounts=accounts; this.secret=secret; this.clock=clock;
    }

    public Map<String,Object> start(AuthResponse user) {
        repository.lockUser(user.id());
        var prior = repository.byUser(user.id()).orElse(null);
        long now = clock.millis();
        if (prior != null && now < prior.deadline()) {
            if (prior.attempts() >= 5 || prior.sends() >= 4) throw limited();
            if (now < prior.resendAt()) throw limited();
        }
        // New logins cannot reset the attempt or send limits during this ten-minute window.
        boolean reuse = prior != null && now < prior.deadline();
        var c = new Challenge(user.id(), UUID.randomUUID().toString(), user.email(), user.rol(), "",
            now + 300_000, reuse ? prior.deadline() : now + 600_000, now + 30_000,
            reuse ? prior.attempts() : 0, reuse ? prior.sends() : 0, false);
        return deliver(c);
    }

    public Map<String,Object> resend(String sessionId) {
        var c = active(sessionId);
        if (clock.millis() < c.resendAt() || c.sends() >= 4) throw limited();
        return deliver(c);
    }

    public AuthResponse verify(String sessionId, String code) {
        var c = active(sessionId);
        if (clock.millis() >= c.expiresAt()) throw error("El código venció. Solicita uno nuevo.");
        boolean valid = code != null && code.matches("[0-9]{6}") && MessageDigest.isEqual(
            c.hash().getBytes(StandardCharsets.UTF_8), hash(c.sessionId(), code).getBytes(StandardCharsets.UTF_8));
        repository.save(new Challenge(c.userId(),c.sessionId(),c.email(),c.role(),valid ? "" : c.hash(),
            c.expiresAt(),c.deadline(),c.resendAt(),c.attempts()+1,c.sends(),valid));
        if (!valid) throw error("Código incorrecto. Quedan " + (4-c.attempts()) + " intentos.");
        var profile = accounts.obtenerPerfil(c.email());
        if (!profile.id().equals(c.userId()) || !profile.rol().equals(c.role())) throw error("La cuenta cambió. Inicia sesión nuevamente.");
        return profile;
    }

    private Challenge active(String sessionId) {
        var c = repository.bySession(sessionId).orElseThrow(() -> error("Verificación no disponible. Inicia sesión nuevamente."));
        if (c.consumed() || clock.millis() >= c.deadline()) throw error("Verificación finalizada. Inicia sesión nuevamente.");
        if (c.attempts() >= 5) throw limited();
        return c;
    }

    private Map<String,Object> deliver(Challenge c) {
        long now = clock.millis();
        String code;
        do { code = String.format(java.util.Locale.ROOT, "%06d", random.nextInt(1_000_000)); }
        while (hash(c.sessionId(), code).equals(c.hash()));
        long expires = Math.min(now + 300_000, c.deadline());
        var next = new Challenge(c.userId(),c.sessionId(),c.email(),c.role(),hash(c.sessionId(), code),
            expires,c.deadline(),now+30_000,c.attempts(),c.sends()+1,false);
        repository.save(next);
        try { mail.send(c.email(),code); }
        catch (RuntimeException ex) {
            // Log only exception types: mail exceptions may contain credentials, addresses or message text.
            Throwable cause = ex;
            while (cause.getCause() != null && cause.getCause() != cause) cause = cause.getCause();
            log.warn("OTP email delivery failed: type={}, cause={}", ex.getClass().getSimpleName(), cause.getClass().getSimpleName());
            // Commit invalidation even if SMTP fails. Never return a usable challenge or token.
            repository.save(new Challenge(next.userId(),next.sessionId(),next.email(),next.role(),"",
                now,next.deadline(),next.resendAt(),next.attempts(),next.sends(),true));
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                "No se pudo enviar el correo. Espera 30 segundos e inicia sesión nuevamente.");
        }
        String[] parts = c.email().split("@", 2);
        String masked = parts[0].substring(0,1) + "***@" + parts[1];
        return Map.of("requiresOtp",true,"authenticated",false,"sessionId",c.sessionId(),
            "maskedEmail",masked,"resendAfterSeconds",30,"expiresInSeconds",Math.max(0,(expires-now)/1000));
    }

    private String hash(String session, String code) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal((session+":"+code).getBytes(StandardCharsets.UTF_8)));
        } catch (java.security.GeneralSecurityException ex) { throw new IllegalStateException(ex); }
    }
    private ResponseStatusException error(String message) { return new ResponseStatusException(HttpStatus.UNAUTHORIZED,message); }
    private ResponseStatusException limited() {
        return new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,"Límite de intentos o envíos. Espera antes de volver a intentarlo (máximo 10 minutos).");
    }
}
