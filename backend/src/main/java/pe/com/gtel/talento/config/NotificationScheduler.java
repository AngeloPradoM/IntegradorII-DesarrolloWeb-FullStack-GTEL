package pe.com.gtel.talento.config;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import pe.com.gtel.talento.recruitment.service.NotificationService;
@Configuration
@EnableScheduling
@ConditionalOnProperty(name="app.notifications.email-enabled",havingValue="true")
public class NotificationScheduler {
    private final NotificationService service;
    public NotificationScheduler(NotificationService service){this.service=service;}
    @Scheduled(fixedDelay=10000) public void deliver(){service.deliverOne();}
}
