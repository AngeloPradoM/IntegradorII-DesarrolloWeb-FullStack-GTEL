package pe.com.gtel.talento.incident.service;

import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class IncidentTransitionPolicy {
    public boolean allows(String role, String current, String next) {
        if ("TECNICO".equals(role)) {
            return switch (current) {
                case "ASIGNADO" -> "EN_INVESTIGACION".equals(next);
                case "EN_INVESTIGACION" -> Set.of("EN_MITIGACION", "SERVICIO_RECUPERADO").contains(next);
                case "EN_MITIGACION" -> "SERVICIO_RECUPERADO".equals(next);
                default -> false;
            };
        }
        if ("ADMIN".equals(role)) {
            return switch (current) {
                case "SERVICIO_RECUPERADO" -> Set.of("VERIFICADO", "EN_INVESTIGACION").contains(next);
                case "VERIFICADO" -> "CERRADO".equals(next);
                case "CERRADO" -> "EN_INVESTIGACION".equals(next);
                default -> false;
            };
        }
        return false;
    }
}
