package pe.com.gtel.talento.incident.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record IncidentTicketLinkRequest(
    @NotBlank @Pattern(regexp = "ORIGEN|AFECTADO|RELACIONADO") String relationship
) {}
