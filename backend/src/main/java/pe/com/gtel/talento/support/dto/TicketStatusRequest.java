package pe.com.gtel.talento.support.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record TicketStatusRequest(
    @NotBlank @Pattern(regexp="NUEVO|ASIGNADO|EN_ATENCION|EN_ESPERA|RESUELTO|CERRADO") String status
) {}
