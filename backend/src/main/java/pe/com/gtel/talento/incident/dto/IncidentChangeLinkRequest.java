package pe.com.gtel.talento.incident.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record IncidentChangeLinkRequest(
    @NotBlank @Pattern(regexp = "MITIGACION|CORRECCION|PREVENCION") String purpose
) {}
