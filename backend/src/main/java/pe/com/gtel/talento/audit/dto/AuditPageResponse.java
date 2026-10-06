package pe.com.gtel.talento.audit.dto;

import java.util.List;
import java.util.Map;

/** Retains the public items/total JSON contract. */
public record AuditPageResponse(List<Map<String, Object>> items, long total) {
}
