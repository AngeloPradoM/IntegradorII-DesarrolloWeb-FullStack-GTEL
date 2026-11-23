package pe.com.gtel.talento.incident.service;

import org.springframework.stereotype.Component;
import pe.com.gtel.talento.incident.dto.IncidentCreateRequest;

@Component
public class IncidentPriorityPolicy {
    public String suggest(IncidentCreateRequest request) {
        boolean broad = "GENERAL".equals(request.scope()) || "MULTIPLE".equals(request.scope());
        boolean urgent = "INMEDIATA".equals(request.urgency()) || "ALTA".equals(request.urgency());

        if ("CRITICO".equals(request.impact()) && "GENERAL".equals(request.scope())
                && request.essentialProcess() && request.serviceBlocked() && !request.workaroundAvailable()) {
            return "P1";
        }
        if ("CRITICO".equals(request.impact())
                || "ALTO".equals(request.impact()) && (broad || urgent)
                || request.serviceBlocked() && (broad || request.essentialProcess())
                || request.essentialProcess() && !request.workaroundAvailable()
                || broad && "INMEDIATA".equals(request.urgency())) {
            return "P2";
        }
        if ("ALTO".equals(request.impact()) || "MEDIO".equals(request.impact()) || broad || urgent) {
            return "P3";
        }
        return "P4";
    }
}
