package pe.com.gtel.talento.auth.controller;
import java.util.Map;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.web.bind.annotation.*;
import pe.com.gtel.talento.auth.service.PasswordRecoveryService;
@RestController
@RequestMapping("/api/auth/password")
public class PasswordRecoveryController {
    public record Request(@NotBlank @Email @Size(max=150) String email) { @Override public String toString(){return "RecoveryRequest[REDACTED]";} }
    public record Reset(@NotBlank @Size(max=100) String token,@NotBlank @Size(min=12,max=72) String password) { @Override public String toString(){return "PasswordReset[REDACTED]";} }
    private final PasswordRecoveryService service;
    public PasswordRecoveryController(PasswordRecoveryService service){this.service=service;}
    @PostMapping("/request") public Map<String,String> request(@Valid @RequestBody Request r){service.request(r.email());return Map.of("message","Si la cuenta está activa y el correo puede entregarse, recibirás un enlace. Revisa spam y espera un minuto antes de reintentar.");}
    @PostMapping("/reset") public Map<String,String> reset(@Valid @RequestBody Reset r){service.reset(r.token(),r.password());return Map.of("message","Contraseña actualizada. Inicia sesión nuevamente.");}
}
