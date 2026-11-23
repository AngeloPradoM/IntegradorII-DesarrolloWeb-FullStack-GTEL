package pe.com.gtel.talento.incident.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record IncidentEscalationResolveRequest(
    @NotBlank @Size(max = 1000) String resolution,
    @NotNull @PositiveOrZero Integer expectedVersion
) {}
