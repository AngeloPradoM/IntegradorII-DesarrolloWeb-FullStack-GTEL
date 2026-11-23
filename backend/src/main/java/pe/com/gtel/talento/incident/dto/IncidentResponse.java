package pe.com.gtel.talento.incident.dto;

import java.time.LocalDateTime;

public record IncidentResponse(
    long id, String code, String title, String component, String type, String source,
    String moduleCode, String suggestedCategory, String categoryCode, String categoryReason,
    String description, String scope, String impact, String urgency, boolean essentialProcess,
    boolean workaroundAvailable, boolean serviceBlocked, String suggestedPriority, String priority, String status,
    String displayStatus, boolean activeEscalation,
    Long reporterId, String reporterEmail, Long responsibleId, String responsibleEmail,
    String assignmentSource, Long assignmentRuleId, LocalDateTime assignedAt,
    Long verifierId, String verifierEmail, LocalDateTime detectedAt, LocalDateTime startedAt,
    LocalDateTime firstAttentionAt, LocalDateTime recoveredAt, LocalDateTime verifiedAt, LocalDateTime closedAt,
    String appliedSolution, String rootCause, String learning, boolean repeatedFailure,
    Long previousIncidentId, LocalDateTime slaFirstAttentionAt, LocalDateTime slaResolutionAt,
    int version, LocalDateTime createdAt, LocalDateTime updatedAt
) {}
