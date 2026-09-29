package pe.com.gtel.talento.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "El correo es obligatorio") @Email(message = "El correo no tiene un formato válido") String email,
        @NotBlank(message = "La contraseña es obligatoria") @Size(max = 72, message = "La contraseña no puede superar 72 caracteres") String password,
        @NotBlank(message = "El rol es obligatorio") String rol) {
}
