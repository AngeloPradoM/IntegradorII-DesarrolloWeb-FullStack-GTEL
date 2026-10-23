package pe.com.gtel.talento.support.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TicketProposalRequest(
    @NotBlank @Size(max=2000) String diagnosis,
    @NotBlank @Size(max=3000) String proposedSolution
) {}
