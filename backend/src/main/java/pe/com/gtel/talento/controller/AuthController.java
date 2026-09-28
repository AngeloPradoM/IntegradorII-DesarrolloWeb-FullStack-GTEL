package pe.com.gtel.talento.controller;

import jakarta.validation.Valid;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import pe.com.gtel.talento.dto.*;
import pe.com.gtel.talento.security.JwtService;
import pe.com.gtel.talento.service.CandidatoService;

/** Step 1: password authentication. OTP is archived outside active sources. */
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final CandidatoService candidatoService;
    private final JwtService jwtService;

    public AuthController(CandidatoService candidatoService, JwtService jwtService) {
        this.candidatoService = candidatoService;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String,Object>> register(@Valid @RequestBody RegistroCandidatoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Cuenta creada correctamente", "user", candidatoService.registrar(request)));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String,Object>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse user = candidatoService.autenticar(request);
        var response = profile(user);
        response.put("requiresOtp", false);
        response.put("authenticated", true);
        response.put("token", jwtService.createToken(user.email(), user.rol()));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String,Object>> me(@RequestHeader(value="Authorization",required=false) String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer "))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No autenticado");
        String email;
        String role;
        try {
            String token = authorization.substring(7).trim();
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
