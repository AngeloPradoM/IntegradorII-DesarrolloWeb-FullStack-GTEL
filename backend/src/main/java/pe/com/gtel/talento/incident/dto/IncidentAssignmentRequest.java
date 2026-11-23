package pe.com.gtel.talento.incident.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record IncidentAssignmentRequest(
    @NotNull Long technicianId,
    @NotNull @PositiveOrZero Integer expectedVersion
) {}
