package pe.com.gtel.talento.support.scheduler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import pe.com.gtel.talento.support.service.SupportTicketCleanupService;

@Component
@ConditionalOnProperty(name = "app.support.cleanup-enabled", havingValue = "true", matchIfMissing = true)
public class SupportTicketCleanupScheduler {
    private static final Logger log = LoggerFactory.getLogger(SupportTicketCleanupScheduler.class);
    private final SupportTicketCleanupService service;

    public SupportTicketCleanupScheduler(SupportTicketCleanupService service) {
        this.service = service;
    }

    @Scheduled(
        cron = "${app.support.cleanup-cron:0 0 2 * * MON}",
        zone = "${app.support.cleanup-zone:America/Lima}"
    )
    public void purgeResolvedTickets() {
        int deleted = service.purgeExpired();
        if (deleted > 0) {
            log.info("Depuracion semanal de soporte completada: {} tickets operativos archivados y eliminados", deleted);
        }
    }
}
