package pe.com.gtel.talento.changemanagement.dto;

import jakarta.validation.constraints.NotNull;

public record ChangeAssignmentRequest(@NotNull Long technicianId) {}
