package pe.com.gtel.talento.support.service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.com.gtel.talento.support.repository.SupportTicketRepository;

@Service
public class SupportTicketCleanupService {
    private static final int MINIMUM_RETENTION_DAYS = 7;

    private final SupportTicketRepository repository;
    private final int retentionDays;
    private final ZoneId cleanupZone;

    public SupportTicketCleanupService(
        SupportTicketRepository repository,
        @Value("${app.support.cleanup-retention-days:7}") int retentionDays,
        @Value("${app.support.cleanup-zone:America/Lima}") String cleanupZone
    ) {
        this.repository = repository;
        this.retentionDays = Math.max(MINIMUM_RETENTION_DAYS, retentionDays);
        this.cleanupZone = ZoneId.of(cleanupZone);
    }

    @Transactional
    public int purgeExpired() {
        LocalDateTime cutoff = LocalDateTime.now(cleanupZone).minusDays(retentionDays);
        return repository.archiveAndDeleteTerminalTicketsBefore(cutoff);
    }
}
