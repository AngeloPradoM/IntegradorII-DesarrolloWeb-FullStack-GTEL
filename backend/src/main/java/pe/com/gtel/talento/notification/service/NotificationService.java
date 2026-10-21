package pe.com.gtel.talento.notification.service;

import java.util.Collection;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import pe.com.gtel.talento.identity.entity.Usuario;
import pe.com.gtel.talento.identity.repository.UsuarioRepository;
import pe.com.gtel.talento.notification.dto.NotificacionResponse;
import pe.com.gtel.talento.notification.dto.UnreadCountResponse;
import pe.com.gtel.talento.notification.entity.Notificacion;
import pe.com.gtel.talento.notification.repository.NotificacionRepository;

@Service
@Transactional
public class NotificationService {

    private final NotificacionRepository notificacionRepository;
    private final UsuarioRepository usuarioRepository;
    private final NotificationSseService sseService;

    public NotificationService(
            NotificacionRepository notificacionRepository,
            UsuarioRepository usuarioRepository,
            NotificationSseService sseService) {
        this.notificacionRepository = notificacionRepository;
        this.usuarioRepository = usuarioRepository;
        this.sseService = sseService;
    }

    @Transactional(readOnly = true)
    public List<NotificacionResponse> getNotificationsForUser(String email) {
        Usuario usuario = getRequiredUser(email);
        return notificacionRepository.findByUsuarioIdOrderByCreatedAtDesc(usuario.getId())
                .stream()
                .map(NotificacionResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public UnreadCountResponse getUnreadCount(String email) {
        Usuario usuario = getRequiredUser(email);
        long count = notificacionRepository.countByUsuarioIdAndLeidaFalse(usuario.getId());
        return new UnreadCountResponse(count);
    }

    public void markAsRead(Long id, String email) {
        Usuario usuario = getRequiredUser(email);
        int updated = notificacionRepository.markAsRead(id, usuario.getId());
        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Notificación no encontrada.");
        }
    }

    public void markAllAsRead(String email) {
        Usuario usuario = getRequiredUser(email);
        notificacionRepository.markAllAsRead(usuario.getId());
    }

    @Transactional(readOnly = true)
    public SseEmitter subscribe(String email) {
        Usuario usuario = getRequiredUser(email);
        return sseService.createEmitter(usuario.getId());
    }

    public NotificacionResponse notifyUser(Long userId, String titulo, String mensaje, String tipo, String enlace) {
        if (userId == null) {
            return null;
        }
        Notificacion entity = new Notificacion(userId, titulo, mensaje, tipo, enlace);
        entity = notificacionRepository.save(entity);
        NotificacionResponse response = NotificacionResponse.fromEntity(entity);
        sseService.sendToUser(userId, response);
        return response;
    }

    public void notifyStaff(String titulo, String mensaje, String tipo, String enlace) {
        notifyUsersWithRoles(List.of("RECLUTADOR", "ADMIN", "ANALISTA_RRHH"), titulo, mensaje, tipo, enlace);
    }

    public void notifyUsersWithRoles(Collection<String> roles, String titulo, String mensaje, String tipo, String enlace) {
        List<Usuario> targetUsers = usuarioRepository.findActiveByRoleNames(roles);
        for (Usuario u : targetUsers) {
            notifyUser(u.getId(), titulo, mensaje, tipo, enlace);
        }
    }

    private Usuario getRequiredUser(String email) {
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesión inválida.");
        }
        return usuarioRepository.findByEmailIgnoreCase(email.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado."));
    }
}
