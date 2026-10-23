package pe.com.gtel.talento.support.dto;

import java.time.LocalDateTime;

public record SupportTicketResponse(
    long id, String code, String title, String category, String subcategory,
    String priority, String description, String priorityJustification, String area,
    String status, long requesterId, String requesterEmail, Long technicianId,
    String technicianEmail, String diagnosis, String proposedSolution,
    String proposalStatus, String adminComment, String executionEvidence,
    LocalDateTime createdAt, LocalDateTime updatedAt, LocalDateTime resolvedAt
) {}
