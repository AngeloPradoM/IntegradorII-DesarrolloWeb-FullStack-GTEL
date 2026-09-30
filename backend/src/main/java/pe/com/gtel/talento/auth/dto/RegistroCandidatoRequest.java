package pe.com.gtel.talento.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;

public record RegistroCandidatoRequest(
        @NotBlank(message = "Los nombres son obligatorios") @Size(max = 80) String nombres,
        @NotBlank(message = "Los apellidos son obligatorios") @Size(max = 80) String apellidos,
        @NotBlank(message = "El correo es obligatorio") @Email(message = "El correo no tiene un formato válido") @Size(max = 150) String email,
        @NotBlank(message = "La contraseña es obligatoria") @Size(min = 8, max = 72) String password,
        @NotBlank @Pattern(regexp = "\\+[1-9][0-9]{7,14}", message = "Usa formato internacional, por ejemplo +51987654321") String telefono) {
    @Override public String toString() { return "RegistroCandidatoRequest[REDACTED]"; }
}
