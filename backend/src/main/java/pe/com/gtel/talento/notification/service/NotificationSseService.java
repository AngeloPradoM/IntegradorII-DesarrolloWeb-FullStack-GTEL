package pe.com.gtel.talento.notification.service;

import jakarta.annotation.PreDestroy;
import java.io.IOException;
import java.util.Collection;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import pe.com.gtel.talento.notification.dto.NotificacionResponse;

@Service
public class NotificationSseService {

    private static final Logger log = LoggerFactory.getLogger(NotificationSseService.class);
    private static final long SSE_TIMEOUT = 30 * 60 * 1000L; // 30 minutos

    private final ConcurrentHashMap<Long, CopyOnWriteArrayList<SseEmitter>> emittersByUserId = new ConcurrentHashMap<>();
    private final ScheduledExecutorService heartbeatExecutor = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread t = new Thread(r, "sse-heartbeat");
        t.setDaemon(true);
        return t;
    });

    public NotificationSseService() {
        // Enviar ping cada 25 segundos para evitar desconexiones por inactividad
        heartbeatExecutor.scheduleAtFixedRate(this::sendHeartbeats, 25, 25, TimeUnit.SECONDS);
    }

    @PreDestroy
    public void cleanup() {
        heartbeatExecutor.shutdownNow();
        emittersByUserId.forEach((uid, list) -> {
            for (SseEmitter emitter : list) {
                try {
                    emitter.complete();
                } catch (Exception ignored) {}
            }
        });
        emittersByUserId.clear();
    }

    public SseEmitter createEmitter(Long userId) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);
        emittersByUserId.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(userId, emitter));
        emitter.onTimeout(() -> {
            emitter.complete();
            removeEmitter(userId, emitter);
        });
        emitter.onError(e -> removeEmitter(userId, emitter));

        try {
            // Confirmación de handshake inicial
            emitter.send(SseEmitter.event()
                    .name("INIT")
                    .data("{\"status\":\"connected\",\"userId\":" + userId + "}", MediaType.APPLICATION_JSON));
        } catch (IOException e) {
            removeEmitter(userId, emitter);
        }

        return emitter;
    }

    private void removeEmitter(Long userId, SseEmitter emitter) {
        CopyOnWriteArrayList<SseEmitter> list = emittersByUserId.get(userId);
        if (list != null) {
            list.remove(emitter);
            if (list.isEmpty()) {
                emittersByUserId.remove(userId);
            }
        }
    }

    public void sendToUser(Long userId, NotificacionResponse notification) {
        CopyOnWriteArrayList<SseEmitter> list = emittersByUserId.get(userId);
        if (list == null || list.isEmpty()) {
            return;
        }

        for (SseEmitter emitter : list) {
            try {
                emitter.send(SseEmitter.event()
                        .name("NOTIFICATION")
                        .data(notification, MediaType.APPLICATION_JSON));
            } catch (Exception e) {
                removeEmitter(userId, emitter);
            }
        }
    }

    public void sendToUsers(Collection<Long> userIds, NotificacionResponse notification) {
        for (Long uid : userIds) {
            sendToUser(uid, notification);
        }
    }

    private void sendHeartbeats() {
        if (emittersByUserId.isEmpty()) {
            return;
        }

        emittersByUserId.forEach((userId, list) -> {
            for (SseEmitter emitter : list) {
                try {
                    emitter.send(SseEmitter.event().comment("ping"));
                } catch (Exception e) {
                    removeEmitter(userId, emitter);
                }
            }
        });
    }
}
