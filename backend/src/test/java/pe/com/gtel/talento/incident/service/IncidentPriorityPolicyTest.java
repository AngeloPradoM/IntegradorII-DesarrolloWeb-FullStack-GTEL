package pe.com.gtel.talento.incident.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import pe.com.gtel.talento.incident.dto.IncidentCreateRequest;

class IncidentPriorityPolicyTest {
    private final IncidentPriorityPolicy policy = new IncidentPriorityPolicy();

    @Test void generalCoreOutageWithoutWorkaroundIsP1() {
        assertEquals("P1", policy.suggest(request("GENERAL", "CRITICO", "INMEDIATA", true, false, true)));
    }

    @Test void broadHighImpactFailureIsP2() {
        assertEquals("P2", policy.suggest(request("MULTIPLE", "ALTO", "ALTA", true, true, true)));
    }

    @Test void limitedDegradationIsP3() {
        assertEquals("P3", policy.suggest(request("LIMITADO", "MEDIO", "MEDIA", false, true, false)));
    }

    @Test void minorNonBlockingProblemIsP4() {
        assertEquals("P4", policy.suggest(request("LIMITADO", "BAJO", "BAJA", false, true, false)));
    }

    private IncidentCreateRequest request(String scope, String impact, String urgency,
                                          boolean essential, boolean workaround, boolean blocked) {
        return new IncidentCreateRequest("Incidente", "Backend", "Disponibilidad", "AVAILABILITY",
            "Descripción", scope, impact, urgency, essential, workaround, blocked, false, null,
            LocalDateTime.of(2026, 11, 19, 10, 0), null, false, null);
    }
}
