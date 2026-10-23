package pe.com.gtel.talento.notification.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.security.Principal;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import pe.com.gtel.talento.notification.dto.NotificacionResponse;
import pe.com.gtel.talento.notification.dto.UnreadCountResponse;
import pe.com.gtel.talento.notification.service.NotificationService;

@RestController
@RequestMapping("/api/notifications")
@Tag(name = "8. Notificaciones en Tiempo Real (SSE)", description = "Suscripción Server-Sent Events (SSE) y gestión de alertas operativas para reclutadores, jefaturas y candidatos.")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    @Operation(summary = "Listar notificaciones del usuario", description = "Devuelve el historial de notificaciones y alertas operativas del usuario conectado.")
    public ResponseEntity<List<NotificacionResponse>> getNotifications(Principal principal) {
        return ResponseEntity.ok(notificationService.getNotificationsForUser(principal.getName()));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Obtener contador de no leídas", description = "Devuelve el número de notificaciones no leídas para el badge de la campana en el frontend.")
    public ResponseEntity<UnreadCountResponse> getUnreadCount(Principal principal) {
        return ResponseEntity.ok(notificationService.getUnreadCount(principal.getName()));
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "Marcar notificación como leída", description = "Actualiza el estado de una notificación individual a leída.")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id, Principal principal) {
        notificationService.markAsRead(id, principal.getName());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/read-all")
    @Operation(summary = "Marcar todas como leídas", description = "Actualiza todas las notificaciones pendientes del usuario a estado leído.")
    public ResponseEntity<Void> markAllAsRead(Principal principal) {
        notificationService.markAllAsRead(principal.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "Canal SSE en tiempo real", description = "Establece el canal persistente HTTP Server-Sent Events para recibir alertas push en vivo.")
    public SseEmitter subscribe(Principal principal) {
        return notificationService.subscribe(principal.getName());
    }
}
