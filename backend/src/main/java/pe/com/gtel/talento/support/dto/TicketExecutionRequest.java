package pe.com.gtel.talento.support.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TicketExecutionRequest(@NotBlank @Size(max=3000) String evidence) {}
