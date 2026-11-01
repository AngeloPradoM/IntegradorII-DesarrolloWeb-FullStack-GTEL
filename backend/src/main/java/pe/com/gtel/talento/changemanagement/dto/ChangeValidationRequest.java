package pe.com.gtel.talento.changemanagement.dto;

import jakarta.validation.constraints.Size;

public record ChangeValidationRequest(boolean accepted, @Size(max = 2000) String comment) {}
