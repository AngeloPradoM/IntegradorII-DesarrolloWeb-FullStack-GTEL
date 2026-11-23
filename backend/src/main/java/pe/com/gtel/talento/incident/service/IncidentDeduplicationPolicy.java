package pe.com.gtel.talento.incident.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import org.springframework.stereotype.Component;

@Component
public class IncidentDeduplicationPolicy {
    public String key(String component, String type, String distinctToken) {
        String normalized = normalize(component) + "|" + normalize(type)
            + (distinctToken == null ? "" : "|" + distinctToken);
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                .digest(normalized.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("No se pudo generar la clave de deduplicación", exception);
        }
    }

    private String normalize(String value) {
        return value.trim().toLowerCase(java.util.Locale.ROOT).replaceAll("\\s+", " ");
    }
}
