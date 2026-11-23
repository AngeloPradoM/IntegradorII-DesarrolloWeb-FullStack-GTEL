package pe.com.gtel.talento.incident.dto;

import java.time.LocalDateTime;

public record IncidentActivityResponse(
    long id, long incidentId, Long actorId, String actorEmail, String type,
    String detail, LocalDateTime createdAt
) {}
