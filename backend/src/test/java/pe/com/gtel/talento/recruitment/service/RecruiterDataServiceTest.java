package pe.com.gtel.talento.recruitment.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.com.gtel.talento.recruitment.repository.RecruiterDataRepository;

@ExtendWith(MockitoExtension.class)
class RecruiterDataServiceTest {

    @Mock
    private RecruiterDataRepository repository;

    private RecruiterDataService service;

    @BeforeEach
    void setUp() {
        service = new RecruiterDataService(repository);
    }

    @Test
    @DisplayName("Debe delegar candidates() al repositorio")
    void shouldDelegateCandidates() {
        when(repository.candidates()).thenReturn(List.of(Map.of("id", 1, "name", "Carlos Perez")));
        List<Map<String, Object>> result = service.candidates();
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Carlos Perez", result.get(0).get("name"));
        verify(repository).candidates();
    }

    @Test
    @DisplayName("Debe retornar estructura completa de analítica en dashboard()")
    void shouldReturnDashboardMetrics() {
        Map<String, Object> mockDashboard = new HashMap<>();
        mockDashboard.put("newApplicants", 6);
        mockDashboard.put("totalApplications", 6);
        mockDashboard.put("scheduledInterviews", 2);
        mockDashboard.put("activeJobs", 5);
        mockDashboard.put("evaluations", 2);
        mockDashboard.put("averageAtsScore", 81);
        mockDashboard.put("timeToHireDays", 10);
        mockDashboard.put("funnel", Map.of(
                "total", 6,
                "conversionRate", 16.7,
                "stages", List.of(Map.of("key", "recibida", "count", 1))
        ));
        mockDashboard.put("quickActions", Map.of("pendingReviews", 2, "todayInterviews", 1));
        mockDashboard.put("applicationsByArea", List.of(Map.of("name", "Ventas", "value", 2)));
        mockDashboard.put("topCandidates", List.of(Map.of("name", "Lucia Ramos", "score", 96)));

        when(repository.dashboard()).thenReturn(mockDashboard);

        Map<String, Object> result = service.dashboard();

        assertNotNull(result);
        assertEquals(6, result.get("newApplicants"));
        assertEquals(2, result.get("scheduledInterviews"));
        assertEquals(5, result.get("activeJobs"));
        assertEquals(81, result.get("averageAtsScore"));
        assertTrue(result.containsKey("funnel"));
        assertTrue(result.containsKey("quickActions"));
        assertTrue(result.containsKey("topCandidates"));
        verify(repository).dashboard();
    }
}
