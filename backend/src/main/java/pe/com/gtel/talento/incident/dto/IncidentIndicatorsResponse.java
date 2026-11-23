package pe.com.gtel.talento.incident.dto;

import java.util.List;

public record IncidentIndicatorsResponse(
    long total,
    long open,
    long closed,
    Double averageAttentionHours,
    Double averageResolutionHours,
    long overdue,
    long repeatedFailures,
    List<DimensionCount> byCategory,
    List<DimensionCount> byPriority,
    List<DimensionCount> byStatus
) {
    public record DimensionCount(String key, long count) {}
}
