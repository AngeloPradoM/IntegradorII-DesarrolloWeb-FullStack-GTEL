package pe.com.gtel.talento.privacy.dto;

import java.time.LocalDateTime;

public record AnonymizeResponse(
        boolean exito,
        String mensaje,
        String baseLegal,
        LocalDateTime fechaEjecucion,
        Long solicitudId
) {}
