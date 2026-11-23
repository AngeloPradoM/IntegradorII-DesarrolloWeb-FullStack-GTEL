package pe.com.gtel.talento.incident.dto;

import java.util.List;

public record IncidentConfigurationResponse(
    List<Category> categories,
    List<ProblemType> problemTypes,
    List<Sla> slaPolicies
) {
    public record Category(String code, String name, String moduleCode) {}
    public record ProblemType(String code, String categoryCode, String name,
                              String description, int displayOrder) {}
    public record Sla(long id, String priority, int firstAttentionMinutes, int resolutionMinutes) {}
}
