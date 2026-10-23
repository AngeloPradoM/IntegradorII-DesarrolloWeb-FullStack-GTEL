package pe.com.gtel.talento.support.service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.com.gtel.talento.support.repository.SupportTicketRepository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SupportTicketCleanupServiceTest {
    @Mock private SupportTicketRepository repository;

    @Test
    void neverDeletesTicketsBeforeSevenDaysEvenWhenConfiguredWithLess() {
        ZoneId lima = ZoneId.of("America/Lima");
        SupportTicketCleanupService service = new SupportTicketCleanupService(repository, 1, lima.getId());
        ArgumentCaptor<LocalDateTime> cutoff = ArgumentCaptor.forClass(LocalDateTime.class);
        when(repository.archiveAndDeleteTerminalTicketsBefore(cutoff.capture())).thenReturn(2);

        LocalDateTime earliestAllowedCutoff = LocalDateTime.now(lima).minusDays(7).minusSeconds(1);
        int deleted = service.purgeExpired();
        LocalDateTime latestAllowedCutoff = LocalDateTime.now(lima).minusDays(7).plusSeconds(1);

        assertEquals(2, deleted);
        assertFalse(cutoff.getValue().isBefore(earliestAllowedCutoff));
        assertFalse(cutoff.getValue().isAfter(latestAllowedCutoff));
        verify(repository).archiveAndDeleteTerminalTicketsBefore(cutoff.getValue());
    }
}
