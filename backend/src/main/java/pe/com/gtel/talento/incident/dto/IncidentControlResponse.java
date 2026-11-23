package pe.com.gtel.talento.incident.dto;

import java.time.LocalDateTime;

public record IncidentControlResponse(
    long id, String code, LocalDateTime detectedAt, String reporter, String description,
    String category, String priority, String responsible, String status,
    LocalDateTime firstAttentionAt, LocalDateTime closedAt, String appliedSolution,
    String causeAndLearning, boolean repeatedFailure, Double attentionHours,
    Double resolutionHours, Double timeLimitHours, boolean overdue, String reportChannel,
    String reporterDetail, Long registeredById, String registeredByEmail
) {}
