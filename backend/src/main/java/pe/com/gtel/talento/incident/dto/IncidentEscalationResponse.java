package pe.com.gtel.talento.incident.dto;

import java.time.LocalDateTime;

public record IncidentEscalationResponse(
    long id, long incidentId, Long escalatedBy, Long destinationUserId, String reason,
    LocalDateTime createdAt, LocalDateTime attendedAt, LocalDateTime resolvedAt,
    Long resolvedBy, String resolution
) {}
