package pe.com.gtel.talento.controller;

import java.util.Map;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.com.gtel.talento.dto.AuthResponse;
import pe.com.gtel.talento.dto.CandidatoResponse;
import pe.com.gtel.talento.dto.LoginRequest;
import pe.com.gtel.talento.dto.RegistroCandidatoRequest;
import pe.com.gtel.talento.service.CandidatoService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final CandidatoService candidatoService;
    public AuthController(CandidatoService candidatoService) { this.candidatoService = candidatoService; }
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegistroCandidatoRequest request) {
        CandidatoResponse candidato = candidatoService.registrar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Cuenta creada correctamente", "user", candidato));
    }
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse candidato = candidatoService.autenticar(request);
        return ResponseEntity.ok(Map.of("message", "Inicio de sesión correcto", "user", candidato));
    }
}
