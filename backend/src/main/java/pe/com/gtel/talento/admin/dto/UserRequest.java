package pe.com.gtel.talento.admin.dto;

import jakarta.validation.constraints.*;

public record UserRequest(
    @NotBlank @Email @Size(max=150) String email,
    @Size(max=72) String password,
    @NotNull @Pattern(regexp="CANDIDATO|RECLUTADOR|ADMIN") String rol,
    @NotNull @Pattern(regexp="activo|inactivo") String estado,
    @Size(max=100) String nombres,
    @Size(max=100) String apellidos,
    @Pattern(regexp="^$|^\\+[1-9][0-9]{7,14}$") String telefono
) {
    @Override public String toString() { return "UserRequest[REDACTED]"; }
}
