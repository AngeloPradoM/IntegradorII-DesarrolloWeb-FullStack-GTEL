package pe.com.gtel.talento.incident.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record IncidentEscalationRequest(
    @Positive Long destinationUserId,
    @NotBlank @Size(max = 1000) String reason,
    @NotNull @PositiveOrZero Integer expectedVersion
) {}
