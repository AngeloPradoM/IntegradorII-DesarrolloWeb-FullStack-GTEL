package pe.com.gtel.talento.incident.dto;

import java.time.LocalDateTime;

public record IncidentHistoryResponse(
    long id, long incidentId, Long actorId, String actorEmail, String previousStatus,
    String newStatus, String detail, LocalDateTime createdAt
) {}
