package pe.com.gtel.talento.notification.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import pe.com.gtel.talento.identity.entity.Rol;
import pe.com.gtel.talento.identity.entity.Usuario;
import pe.com.gtel.talento.identity.repository.UsuarioRepository;
import pe.com.gtel.talento.notification.dto.NotificacionResponse;
import pe.com.gtel.talento.notification.dto.UnreadCountResponse;
import pe.com.gtel.talento.notification.entity.Notificacion;
import pe.com.gtel.talento.notification.repository.NotificacionRepository;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificacionRepository notificacionRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private NotificationSseService sseService;

    private NotificationService notificationService;

    private Usuario testUser;

    @BeforeEach
    void setUp() {
        notificationService = new NotificationService(notificacionRepository, usuarioRepository, sseService);
        testUser = new Usuario("reclutador1@gmail.com", "hash", new Rol("RECLUTADOR", "Reclutador"));
        testUser.setId(3L);
    }

    @Test
    @DisplayName("getNotificationsForUser debe retornar lista ordenada de notificaciones")
    void shouldReturnNotificationsForUser() {
        when(usuarioRepository.findByEmailIgnoreCase("reclutador1@gmail.com")).thenReturn(Optional.of(testUser));
        Notificacion notif = new Notificacion(3L, "Nueva postulación", "Mensaje de prueba", "POSTULACION_NUEVA", "/reclutador/postulantes");
        notif.setId(10L);
        when(notificacionRepository.findByUsuarioIdOrderByCreatedAtDesc(3L)).thenReturn(List.of(notif));

        List<NotificacionResponse> results = notificationService.getNotificationsForUser("reclutador1@gmail.com");

        assertNotNull(results);
        assertEquals(1, results.size());
        assertEquals("Nueva postulación", results.get(0).title());
        assertEquals("/reclutador/postulantes", results.get(0).link());
        assertFalse(results.get(0).read());
    }

    @Test
    @DisplayName("getUnreadCount debe retornar cantidad de no leídas")
    void shouldReturnUnreadCount() {
        when(usuarioRepository.findByEmailIgnoreCase("reclutador1@gmail.com")).thenReturn(Optional.of(testUser));
        when(notificacionRepository.countByUsuarioIdAndLeidaFalse(3L)).thenReturn(4L);

        UnreadCountResponse response = notificationService.getUnreadCount("reclutador1@gmail.com");

        assertEquals(4L, response.unreadCount());
    }

    @Test
    @DisplayName("markAsRead debe marcar una notificación específica como leída")
    void shouldMarkAsRead() {
        when(usuarioRepository.findByEmailIgnoreCase("reclutador1@gmail.com")).thenReturn(Optional.of(testUser));
        when(notificacionRepository.markAsRead(10L, 3L)).thenReturn(1);

        assertDoesNotThrow(() -> notificationService.markAsRead(10L, "reclutador1@gmail.com"));
        verify(notificacionRepository).markAsRead(10L, 3L);
    }

    @Test
    @DisplayName("markAsRead debe lanzar 404 si la notificación no pertenece al usuario")
    void shouldThrowWhenMarkAsReadNotFound() {
        when(usuarioRepository.findByEmailIgnoreCase("reclutador1@gmail.com")).thenReturn(Optional.of(testUser));
        when(notificacionRepository.markAsRead(99L, 3L)).thenReturn(0);

        assertThrows(ResponseStatusException.class, () -> notificationService.markAsRead(99L, "reclutador1@gmail.com"));
    }

    @Test
    @DisplayName("markAllAsRead debe invocar repositorio para el usuario actual")
    void shouldMarkAllAsRead() {
        when(usuarioRepository.findByEmailIgnoreCase("reclutador1@gmail.com")).thenReturn(Optional.of(testUser));

        notificationService.markAllAsRead("reclutador1@gmail.com");

        verify(notificacionRepository).markAllAsRead(3L);
    }

    @Test
    @DisplayName("subscribe debe registrar emitter en el servicio SSE")
    void shouldSubscribeToSse() {
        when(usuarioRepository.findByEmailIgnoreCase("reclutador1@gmail.com")).thenReturn(Optional.of(testUser));
        SseEmitter mockEmitter = new SseEmitter();
        when(sseService.createEmitter(3L)).thenReturn(mockEmitter);

        SseEmitter result = notificationService.subscribe("reclutador1@gmail.com");

        assertSame(mockEmitter, result);
    }

    @Test
    @DisplayName("notifyUser debe guardar en BD y retransmitir vía SSE")
    void shouldPersistAndBroadcastToUser() {
        Notificacion entity = new Notificacion(3L, "Alerta", "Detalle", "TIPO", "/link");
        entity.setId(50L);
        when(notificacionRepository.save(any(Notificacion.class))).thenReturn(entity);

        NotificacionResponse res = notificationService.notifyUser(3L, "Alerta", "Detalle", "TIPO", "/link");

        assertNotNull(res);
        assertEquals(50L, res.id());
        verify(notificacionRepository).save(any(Notificacion.class));
        verify(sseService).sendToUser(eq(3L), any(NotificacionResponse.class));
    }

    @Test
    @DisplayName("notifyStaff debe notificar a usuarios con roles RECLUTADOR, ADMIN y ANALISTA_RRHH")
    void shouldNotifyStaffRoles() {
        Usuario admin = new Usuario("admin@gtel.pe", "hash", new Rol("ADMIN", "Admin"));
        admin.setId(1L);
        when(usuarioRepository.findActiveByRoleNames(anyCollection())).thenReturn(List.of(admin, testUser));

        Notificacion n1 = new Notificacion(1L, "Postulación", "Detalle", "TIPO", "/link");
        n1.setId(101L);
        Notificacion n2 = new Notificacion(3L, "Postulación", "Detalle", "TIPO", "/link");
        n2.setId(102L);

        when(notificacionRepository.save(any(Notificacion.class))).thenReturn(n1, n2);

        notificationService.notifyStaff("Postulación", "Detalle", "TIPO", "/link");

        verify(notificacionRepository, times(2)).save(any(Notificacion.class));
        verify(sseService).sendToUser(eq(1L), any(NotificacionResponse.class));
        verify(sseService).sendToUser(eq(3L), any(NotificacionResponse.class));
    }
}
