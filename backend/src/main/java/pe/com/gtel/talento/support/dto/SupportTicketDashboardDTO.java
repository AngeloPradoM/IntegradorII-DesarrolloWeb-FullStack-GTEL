package pe.com.gtel.talento.support.dto;

import java.time.LocalDateTime;

public record SupportTicketDashboardDTO(
    long id,
    String code,
    String title,
    String category,
    String priority,
    String assignedTo, 
    String status,
    LocalDateTime createdAt,
    LocalDateTime slaDeadline,
    String slaStatus 
) {}