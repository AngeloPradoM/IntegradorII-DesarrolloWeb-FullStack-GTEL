package pe.com.gtel.talento.incident.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class IncidentTransitionPolicyTest {
    private final IncidentTransitionPolicy policy = new IncidentTransitionPolicy();

    @Test void technicianCanInvestigateMitigateAndReportRecovery() {
        assertTrue(policy.allows("TECNICO", "ASIGNADO", "EN_INVESTIGACION"));
        assertTrue(policy.allows("TECNICO", "EN_INVESTIGACION", "EN_MITIGACION"));
        assertTrue(policy.allows("TECNICO", "EN_MITIGACION", "SERVICIO_RECUPERADO"));
    }

    @Test void technicianCannotVerifyOrClose() {
        assertFalse(policy.allows("TECNICO", "SERVICIO_RECUPERADO", "VERIFICADO"));
        assertFalse(policy.allows("TECNICO", "VERIFICADO", "CERRADO"));
    }

    @Test void administratorVerifiesClosesAndCanReopen() {
        assertTrue(policy.allows("ADMIN", "SERVICIO_RECUPERADO", "VERIFICADO"));
        assertTrue(policy.allows("ADMIN", "VERIFICADO", "CERRADO"));
        assertTrue(policy.allows("ADMIN", "CERRADO", "EN_INVESTIGACION"));
    }

    @Test void recruiterCannotChangeOperationalState() {
        assertFalse(policy.allows("RECLUTADOR", "ASIGNADO", "EN_INVESTIGACION"));
        assertFalse(policy.allows("RECLUTADOR", "VERIFICADO", "CERRADO"));
    }
}
