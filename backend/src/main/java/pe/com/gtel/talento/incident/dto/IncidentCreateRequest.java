package pe.com.gtel.talento.incident.dto;

import java.time.LocalDateTime;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record IncidentCreateRequest(
    @NotBlank @Size(max = 180) String title,
    @NotBlank @Size(max = 100) String component,
    @NotBlank @Size(max = 80) String type,
    @Pattern(regexp = "AUTH|CV|APPLICATIONS|JOBS|DATABASE|PERFORMANCE|AVAILABILITY|NOTIFICATIONS|UI|OTHER") String moduleCode,
    @NotBlank @Size(max = 5000) String description,
    @NotBlank @Pattern(regexp = "LIMITADO|MULTIPLE|GENERAL") String scope,
    @NotBlank @Pattern(regexp = "BAJO|MEDIO|ALTO|CRITICO") String impact,
    @NotBlank @Pattern(regexp = "BAJA|MEDIA|ALTA|INMEDIATA") String urgency,
    boolean essentialProcess,
    boolean workaroundAvailable,
    boolean serviceBlocked,
    boolean repeatedFailure,
    Long previousIncidentId,
    @NotNull @PastOrPresent LocalDateTime detectedAt,
    @PastOrPresent LocalDateTime startedAt,
    boolean confirmDistinctIncident,
    @Size(max = 500) String distinctReason,
    @NotBlank @Pattern(regexp = "INC_[A-Z0-9_]+") @Size(max = 64) String incidentTypeCode,
    @Pattern(regexp = "MANUAL|MONITOREO") String source,
    @PastOrPresent LocalDateTime recoveredAt
) {
    public IncidentCreateRequest(String title, String component, String type, String moduleCode,
            String description, String scope, String impact, String urgency,
            boolean essentialProcess, boolean workaroundAvailable, boolean serviceBlocked,
            boolean repeatedFailure, Long previousIncidentId, LocalDateTime detectedAt,
            LocalDateTime startedAt, boolean confirmDistinctIncident, String distinctReason) {
        this(title, component, type, moduleCode, description, scope, impact, urgency,
            essentialProcess, workaroundAvailable, serviceBlocked, repeatedFailure,
            previousIncidentId, detectedAt, startedAt, confirmDistinctIncident, distinctReason,
            null, null, null);
    }

    public IncidentCreateRequest(String title, String component, String type, String moduleCode,
            String description, String scope, String impact, String urgency,
            boolean essentialProcess, boolean workaroundAvailable, boolean serviceBlocked,
            boolean repeatedFailure, Long previousIncidentId, LocalDateTime detectedAt,
            LocalDateTime startedAt, boolean confirmDistinctIncident, String distinctReason,
            String incidentTypeCode) {
        this(title, component, type, moduleCode, description, scope, impact, urgency,
            essentialProcess, workaroundAvailable, serviceBlocked, repeatedFailure,
            previousIncidentId, detectedAt, startedAt, confirmDistinctIncident, distinctReason,
            incidentTypeCode, null, null);
    }
}
