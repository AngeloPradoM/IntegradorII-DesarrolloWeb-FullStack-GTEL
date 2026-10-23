package pe.com.gtel.talento.support.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record TicketCreateRequest(
    @NotBlank @Size(max=120) String title,
    @NotBlank @Size(max=80) String category,
    @NotBlank @Size(max=100) String subcategory,
    @NotBlank @Pattern(regexp="BAJA|MEDIA|ALTA") String priority,
    @NotBlank @Size(max=2000) String description,
    @NotBlank @Size(max=1000) String priorityJustification
) {}
