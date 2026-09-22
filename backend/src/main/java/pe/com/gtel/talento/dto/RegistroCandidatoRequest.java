package pe.com.gtel.talento.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegistroCandidatoRequest(
        @NotBlank(message = "Los nombres son obligatorios") @Size(max = 80) String nombres,
        @NotBlank(message = "Los apellidos son obligatorios") @Size(max = 80) String apellidos,
        @NotBlank(message = "El correo es obligatorio") @Email(message = "El correo no tiene un formato válido") @Size(max = 150) String email,
        @NotBlank(message = "La contraseña es obligatoria") @Size(min = 8, max = 72) String password) {
}
