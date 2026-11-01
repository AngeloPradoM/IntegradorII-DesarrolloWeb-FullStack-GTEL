package pe.com.gtel.talento.changemanagement.dto;

import java.time.LocalDateTime;

public record ChangeResponse(
    long id, String code, String title, String type, String category, String priority,
    String impact, String urgency, String description, String justification, String affectedAreas,
    String status, long requesterId, String requesterEmail, Long responsibleId, String responsibleEmail,
    Long implementerId, String implementerEmail, String technicalEvaluation, String implementationPlan,
    String testPlan, String rollbackPlan, String communicationPlan, String riskProbability,
    String riskImpact, String riskLevel, String cabComment, String cabMembers, String executionEvidence,
    String result, String lessonsLearned, String validationComment, String documentName,
    LocalDateTime createdAt, LocalDateTime updatedAt, LocalDateTime approvedAt,
    LocalDateTime implementedAt, LocalDateTime closedAt
) {}
