package pe.com.gtel.talento.incident.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record IncidentStatusRequest(
    @NotBlank @Pattern(regexp = "EN_INVESTIGACION|EN_MITIGACION|SERVICIO_RECUPERADO|VERIFICADO|CERRADO") String status,
    @NotBlank @Size(max = 1000) String detail,
    @NotNull @PositiveOrZero Integer expectedVersion
) {}
