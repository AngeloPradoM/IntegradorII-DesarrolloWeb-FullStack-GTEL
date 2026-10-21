package pe.com.gtel.talento.auth.controller;

import jakarta.validation.Valid;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import pe.com.gtel.talento.auth.dto.*;
import pe.com.gtel.talento.security.JwtService;
import pe.com.gtel.talento.auth.service.CandidatoService;
import pe.com.gtel.talento.auth.service.EmailOtpService;

/** Password plus email OTP, with explicitly enabled development account exceptions. */
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final CandidatoService candidatoService;
    private final JwtService jwtService;
    private final EmailOtpService otp;
    private final pe.com.gtel.talento.security.AccountAccessService access;

    public AuthController(CandidatoService candidatoService, JwtService jwtService, EmailOtpService otp, pe.com.gtel.talento.security.AccountAccessService access) {
        this.candidatoService = candidatoService;
        this.jwtService = jwtService;
        this.otp = otp;
        this.access = access;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String,Object>> register(@Valid @RequestBody RegistroCandidatoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Cuenta creada correctamente", "user", candidatoService.registrar(request)));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String,Object>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse user = candidatoService.autenticar(request);
        if(access.bypass(access.find(user.email()))) return ResponseEntity.ok(session(user,"TEST_PASSWORD"));
        return ResponseEntity.ok(otp.start(user));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<Map<String,Object>> resend(@Valid @RequestBody ResendOtpRequest request) {
        return ResponseEntity.ok(otp.resend(request.sessionId().toString()));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String,Object>> verify(@Valid @RequestBody OtpRequest request) {
        AuthResponse user = otp.verify(request.sessionId().toString(), request.otp());
        return ResponseEntity.ok(session(user,"EMAIL_OTP"));
    }

    private Map<String,Object> session(AuthResponse user, String method) {
        var account=access.find(user.email());
        if (!"activo".equals(account.status()) || !account.role().equals(user.rol())) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Cuenta modificada");
        var response = profile(user);
        response.put("verified", "EMAIL_OTP".equals(method));
        response.put("authMethod",method);
        response.put("otpSkipped","TEST_PASSWORD".equals(method));
        response.put("requiresOtp", false);
        response.put("authenticated", true);
        response.put("token", jwtService.createToken(user.email(), user.rol(), account.version(), method));
        return response;
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String,Object>> me(@RequestHeader(value="Authorization",required=false) String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer "))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No autenticado");
        String email;
        String role;
        try {
            String token = authorization.substring(7).trim();
            access.validate(token,jwtService);
            email = jwtService.getEmail(token);
            role = jwtService.getRole(token);
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token inválido o vencido");
        }
        AuthResponse user = candidatoService.obtenerPerfil(email);
        if (!user.rol().equals(role)) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "El rol de la cuenta cambió; inicia sesión nuevamente");
        var response = profile(user);
        response.put("authenticated", true);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public Map<String,Object> logout() {
        // JWT remains valid until expiry; revocation policy is a separate pending task.
        return Map.of("message", "Elimina el token del cliente para cerrar sesión");
    }

    private Map<String,Object> profile(AuthResponse user) {
        var response = new LinkedHashMap<String,Object>();
        response.put("id", user.id());
        response.put("nombres", user.nombres());
        response.put("apellidos", user.apellidos());
        response.put("email", user.email());
        response.put("telefono", user.telefono());
        response.put("rol", user.rol());
        response.put("role", user.rol());
        return response;
    }
}
