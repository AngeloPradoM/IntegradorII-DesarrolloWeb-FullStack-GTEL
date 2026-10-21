package pe.com.gtel.talento.notification.dto;

import java.time.format.DateTimeFormatter;
import pe.com.gtel.talento.notification.entity.Notificacion;

public record NotificacionResponse(
        Long id,
        String title,
        String description,
        String type,
        String link,
        boolean read,
        String createdAt,
        String titulo,
        String mensaje,
        boolean leida
) {
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    public static NotificacionResponse fromEntity(Notificacion n) {
        String dateStr = n.getCreatedAt() != null ? n.getCreatedAt().format(FORMATTER) : "";
        return new NotificacionResponse(
                n.getId(),
                n.getTitulo(),
                n.getMensaje(),
                n.getTipo(),
                n.getEnlace(),
                n.isLeida(),
                dateStr,
                n.getTitulo(),
                n.getMensaje(),
                n.isLeida()
        );
    }
}
