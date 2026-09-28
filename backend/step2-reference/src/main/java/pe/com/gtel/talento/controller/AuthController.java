package pe.com.gtel.talento.controller;

import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import pe.com.gtel.talento.dto.AuthResponse;
import pe.com.gtel.talento.dto.CandidatoResponse;
import pe.com.gtel.talento.dto.LoginRequest;
import pe.com.gtel.talento.dto.RegistroCandidatoRequest;
import pe.com.gtel.talento.otp.OtpSessionStatus;
import pe.com.gtel.talento.security.JwtService;
import pe.com.gtel.talento.service.CandidatoService;
import pe.com.gtel.talento.service.OtpSessionService;
import pe.com.gtel.talento.service.WhatsAppService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final CandidatoService candidatoService;
    private final OtpSessionService otpSessionService;
    private final WhatsAppService whatsappService;
    private final JwtService jwtService;

    public AuthController(CandidatoService candidatoService, OtpSessionService otpSessionService,
                         WhatsAppService whatsappService, JwtService jwtService) {
        this.candidatoService = candidatoService;
        this.otpSessionService = otpSessionService;
        this.whatsappService = whatsappService;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegistroCandidatoRequest request) {
        CandidatoResponse candidato = candidatoService.registrar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Cuenta creada correctamente", "user", candidato));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse candidato = candidatoService.autenticar(request);
        if (!"CANDIDATO".equalsIgnoreCase(candidato.rol())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La verificación WhatsApp requiere un perfil de candidato con teléfono registrado");
        }
        var otpData = otpSessionService.createSession(String.valueOf(candidato.id()),
                candidato.email(), candidato.rol(), candidato.telefono());
        return deliver(otpData);
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<Map<String, Object>> resendOtp(@RequestBody Map<String, String> payload) {
        String sessionId = payload.get("sessionId");
        if (sessionId == null || sessionId.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "sessionId es obligatorio");
        return deliver(otpSessionService.resendOtp(sessionId));
    }

    private ResponseEntity<Map<String, Object>> deliver(OtpSessionService.OtpSessionData data) {
        try {
            whatsappService.sendCode(data.recipientPhone(), data.otpCode());
        } catch (RuntimeException ex) {
            otpSessionService.invalidateSession(data.sessionId());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "No se pudo enviar el código por WhatsApp; inicia sesión nuevamente");
        }
        return ResponseEntity.ok(Map.of(
                "requiresOtp", true, "sessionId", data.sessionId(), "status", data.status(),
                "maskedPhone", data.maskedPhone(), "expiresInSeconds", data.expiresInSeconds(),
                "resendAfterSeconds", data.resendAfterSeconds(), "message", "Código enviado por WhatsApp"));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, Object>> verifyOtp(@RequestBody Map<String, String> payload) {
        String sessionId = payload.get("sessionId");
        String otpCode = payload.get("otp");
        if (sessionId == null || sessionId.isBlank() || otpCode == null || otpCode.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Se requieren sessionId y otp");
        }

        OtpSessionService.VerificationResult result = otpSessionService.verifyOtp(sessionId, otpCode);
        if (!result.verified()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "verified", false,
                    "status", result.status(),
                    "message", "Código de verificación inválido o expirado"));
        }

        String email = otpSessionService.getEmail(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesión no válida"));
        String role = otpSessionService.getRole(sessionId).orElse("CANDIDATO");
        String token = jwtService.createToken(email, role);
        otpSessionService.invalidateSession(sessionId);

        return ResponseEntity.ok(Map.of(
                "verified", true,
                "status", OtpSessionStatus.AUTHENTICATED.name(),
                "message", "Autenticación completada",
                "token", token,
                "email", email,
                "role", role));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(@RequestHeader(value = "Authorization", required = false) String authorization) {
        if (authorization != null && authorization.startsWith("Bearer ")) {
            String token = authorization.substring(7);
            if (!token.isBlank()) {
                // La validación real de JWT se realiza por el filtro; aquí solo limpiamos el estado local.
            }
        }

        return ResponseEntity.ok(Map.of("message", "Sesión cerrada"));
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(@RequestHeader(value = "Authorization", required = false) String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("authenticated", false, "message", "No autenticado"));
        }

        String token = authorization.substring(7).trim();
        if (token.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("authenticated", false, "message", "Token vacío"));
        }

        try {
            String email = jwtService.getEmail(token);
            String role = jwtService.getRole(token);
            return ResponseEntity.ok(Map.of("authenticated", true, "email", email, "role", role));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("authenticated", false, "message", "Token inválido"));
        }
    }
}
