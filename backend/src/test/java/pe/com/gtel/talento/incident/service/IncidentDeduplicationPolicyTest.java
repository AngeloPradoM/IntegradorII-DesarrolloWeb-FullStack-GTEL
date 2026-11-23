package pe.com.gtel.talento.incident.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

import org.junit.jupiter.api.Test;

class IncidentDeduplicationPolicyTest {
    private final IncidentDeduplicationPolicy policy = new IncidentDeduplicationPolicy();

    @Test void equivalentComponentAndTypeProduceSameKey() {
        assertEquals(policy.key(" Backend API ", "Disponibilidad", null),
            policy.key("backend   api", " disponibilidad ", null));
    }

    @Test void authorizedDistinctIncidentGetsDifferentKey() {
        assertNotEquals(policy.key("Backend", "Disponibilidad", null),
            policy.key("Backend", "Disponibilidad", "autorizado-2"));
    }
}
