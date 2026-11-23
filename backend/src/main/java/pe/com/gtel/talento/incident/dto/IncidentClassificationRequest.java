package pe.com.gtel.talento.incident.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record IncidentClassificationRequest(
    @NotBlank @Pattern(regexp = "P1|P2|P3|P4") String priority,
    @Size(max = 800) String reason,
    @Size(max = 50) String categoryCode,
    @Size(max = 800) String categoryReason,
    @NotNull @PositiveOrZero Integer expectedVersion
) {}
