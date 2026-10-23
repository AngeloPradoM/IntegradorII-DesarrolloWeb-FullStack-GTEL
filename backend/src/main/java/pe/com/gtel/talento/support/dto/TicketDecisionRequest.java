package pe.com.gtel.talento.support.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TicketDecisionRequest(
    @NotNull Boolean approved,
    @Size(max=1000) String comment
) {}
