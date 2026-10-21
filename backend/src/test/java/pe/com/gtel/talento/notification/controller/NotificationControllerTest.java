package pe.com.gtel.talento.notification.controller;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.security.Principal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import pe.com.gtel.talento.notification.dto.NotificacionResponse;
import pe.com.gtel.talento.notification.dto.UnreadCountResponse;
import pe.com.gtel.talento.notification.service.NotificationService;

@ExtendWith(MockitoExtension.class)
class NotificationControllerTest {

    @Mock
    private NotificationService notificationService;

    @Mock
    private Principal principal;

    private NotificationController controller;

    @BeforeEach
    void setUp() {
        controller = new NotificationController(notificationService);
        when(principal.getName()).thenReturn("reclutador1@gmail.com");
    }

    @Test
    @DisplayName("GET /api/notifications retorna la lista de notificaciones")
    void shouldReturnNotifications() {
        NotificacionResponse item = new NotificacionResponse(
                1L, "Titulo", "Mensaje", "TIPO", "/link", false, "12/10/2026 12:00", "Titulo", "Mensaje", false
        );
        when(notificationService.getNotificationsForUser("reclutador1@gmail.com")).thenReturn(List.of(item));

        ResponseEntity<List<NotificacionResponse>> response = controller.getNotifications(principal);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertEquals("Titulo", response.getBody().get(0).title());
    }

    @Test
    @DisplayName("GET /api/notifications/unread-count retorna conteo de no leídas")
    void shouldReturnUnreadCount() {
        when(notificationService.getUnreadCount("reclutador1@gmail.com")).thenReturn(new UnreadCountResponse(5L));

        ResponseEntity<UnreadCountResponse> response = controller.getUnreadCount(principal);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(5L, response.getBody().unreadCount());
    }

    @Test
    @DisplayName("PUT /api/notifications/{id}/read retorna 204 No Content")
    void shouldMarkAsRead() {
        doNothing().when(notificationService).markAsRead(10L, "reclutador1@gmail.com");

        ResponseEntity<Void> response = controller.markAsRead(10L, principal);

        assertEquals(204, response.getStatusCode().value());
        verify(notificationService).markAsRead(10L, "reclutador1@gmail.com");
    }

    @Test
    @DisplayName("PUT /api/notifications/read-all retorna 204 No Content")
    void shouldMarkAllAsRead() {
        doNothing().when(notificationService).markAllAsRead("reclutador1@gmail.com");

        ResponseEntity<Void> response = controller.markAllAsRead(principal);

        assertEquals(204, response.getStatusCode().value());
        verify(notificationService).markAllAsRead("reclutador1@gmail.com");
    }

    @Test
    @DisplayName("GET /api/notifications/stream retorna SseEmitter")
    void shouldSubscribeToSseStream() {
        SseEmitter emitter = new SseEmitter();
        when(notificationService.subscribe("reclutador1@gmail.com")).thenReturn(emitter);

        SseEmitter result = controller.subscribe(principal);

        assertSame(emitter, result);
        verify(notificationService).subscribe("reclutador1@gmail.com");
    }
}
