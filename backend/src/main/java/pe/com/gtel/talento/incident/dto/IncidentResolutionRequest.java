package pe.com.gtel.talento.incident.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record IncidentResolutionRequest(
    @NotBlank @Size(max = 5000) String solutionApplied,
    @Size(max = 5000) String rootCause,
    @Size(max = 5000) String learning,
    @NotNull @PositiveOrZero Integer expectedVersion
) {}
