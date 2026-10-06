package pe.com.gtel.talento.recruitment.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown=true)
public record ApplicationPersonalRequest(@NotBlank @Size(max=100) String nombres,@NotBlank @Size(max=100) String apellidos,
        @NotBlank @Pattern(regexp="[0-9]{8}") String dni,
        @NotBlank @Pattern(regexp="\\+[1-9][0-9]{7,14}") String telefono,
        @NotBlank @Size(max=100) String distrito,@Size(max=3000) String motivacion) {}
