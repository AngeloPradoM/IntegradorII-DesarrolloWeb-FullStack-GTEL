package pe.com.gtel.talento.incident.service;

import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class IncidentPermissionPolicy {
    private static final Set<String> OPERATIONAL_ROLES = Set.of("ADMIN", "TECNICO");
    private static final Set<String> REPORTER_ROLES = Set.of("ADMIN", "TECNICO");

    public boolean canUseOperationalQueue(String role) { return OPERATIONAL_ROLES.contains(role); }
    public boolean canReadRegistrationConfiguration(String role) {
        return REPORTER_ROLES.contains(role) || "RECLUTADOR".equals(role);
    }
    public boolean canRegister(String role) { return REPORTER_ROLES.contains(role); }
    public boolean canAdminister(String role) { return "ADMIN".equals(role); }
    public boolean canPerformTechnicalWork(String role) { return "TECNICO".equals(role); }
    public boolean canReadOwnLinkedSummary(String role) { return "RECLUTADOR".equals(role); }
}
