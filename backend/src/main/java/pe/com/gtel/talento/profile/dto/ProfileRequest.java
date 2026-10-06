package pe.com.gtel.talento.profile.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ProfileRequest(@NotBlank @Size(max=100) String nombres,@NotBlank @Size(max=100) String apellidos,
        @NotBlank @Pattern(regexp="\\+[1-9][0-9]{7,14}") String telefono,
        @Size(max=100) String ubicacion,@Size(max=100) String localidad,
        @Email @Size(max=150) String correoContacto,@Size(max=2800000) String foto,
        @Size(max=10000) String educacion,@Size(max=10000) String experiencia) {}
