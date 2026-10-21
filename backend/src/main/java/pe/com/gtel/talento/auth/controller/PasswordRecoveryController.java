package pe.com.gtel.talento.auth.controller;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.com.gtel.talento.auth.dto.PasswordRecoveryRequest;
import pe.com.gtel.talento.auth.dto.PasswordResetRequest;
import pe.com.gtel.talento.auth.service.PasswordRecoveryService;
import pe.com.gtel.talento.shared.api.MessageResponse;

@RestController
@RequestMapping("/api/auth/password")
public class PasswordRecoveryController {

    private final PasswordRecoveryService service;
    public PasswordRecoveryController(PasswordRecoveryService service){this.service=service;}
    @PostMapping("/request") public MessageResponse request(@Valid @RequestBody PasswordRecoveryRequest r){service.request(r.email());return new MessageResponse("Si la cuenta está activa y el correo puede entregarse, recibirás un enlace. Revisa spam y espera un minuto antes de reintentar.");}
    @PostMapping("/reset") public MessageResponse reset(@Valid @RequestBody PasswordResetRequest r){service.reset(r.token(),r.password());return new MessageResponse("Contraseña actualizada. Inicia sesión nuevamente.");}
}
