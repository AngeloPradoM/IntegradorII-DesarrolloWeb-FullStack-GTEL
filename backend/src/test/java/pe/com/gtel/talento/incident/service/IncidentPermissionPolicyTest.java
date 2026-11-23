package pe.com.gtel.talento.incident.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class IncidentPermissionPolicyTest {
    private final IncidentPermissionPolicy policy = new IncidentPermissionPolicy();

    @Test void administratorKeepsClassificationAssignmentLinkAndClosureAuthority() {
        assertTrue(policy.canUseOperationalQueue("ADMIN"));
        assertTrue(policy.canReadRegistrationConfiguration("ADMIN"));
        assertTrue(policy.canRegister("ADMIN"));
        assertTrue(policy.canAdminister("ADMIN"));
        assertFalse(policy.canPerformTechnicalWork("ADMIN"));
    }

    @Test void technicianRegistersAndWorksButDoesNotAdminister() {
        assertTrue(policy.canUseOperationalQueue("TECNICO"));
        assertTrue(policy.canReadRegistrationConfiguration("TECNICO"));
        assertTrue(policy.canRegister("TECNICO"));
        assertTrue(policy.canPerformTechnicalWork("TECNICO"));
        assertFalse(policy.canAdminister("TECNICO"));
    }

    @Test void recruiterReadsOwnLinkedSummaryButCannotRegisterOrOperateIncidents() {
        assertTrue(policy.canReadOwnLinkedSummary("RECLUTADOR"));
        assertTrue(policy.canReadRegistrationConfiguration("RECLUTADOR"));
        assertFalse(policy.canUseOperationalQueue("RECLUTADOR"));
        assertFalse(policy.canRegister("RECLUTADOR"));
        assertFalse(policy.canAdminister("RECLUTADOR"));
        assertFalse(policy.canPerformTechnicalWork("RECLUTADOR"));
    }
}
