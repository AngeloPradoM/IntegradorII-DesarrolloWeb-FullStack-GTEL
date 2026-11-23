package pe.com.gtel.talento.incident.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record IncidentActivityRequest(
    @NotBlank @Pattern(regexp = "DIAGNOSTICO|MITIGACION|EVIDENCIA|CAUSA|RESOLUCION|PREVENCION|NOTA") String type,
    @NotBlank @Size(max = 5000) String detail
) {}
