package pe.com.gtel.talento.notification.scheduler;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import pe.com.gtel.talento.notification.service.NotificationService;
@Component
@ConditionalOnProperty(name="app.notifications.email-enabled",havingValue="true")
public class NotificationScheduler {
    private final NotificationService service;
    public NotificationScheduler(NotificationService service){this.service=service;}
    @Scheduled(fixedDelay=10000) public void deliver(){service.deliverOne();}
}
