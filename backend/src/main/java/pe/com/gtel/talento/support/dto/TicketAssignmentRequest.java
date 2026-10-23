package pe.com.gtel.talento.support.dto;

import jakarta.validation.constraints.NotNull;

public record TicketAssignmentRequest(@NotNull Long technicianId) {}
