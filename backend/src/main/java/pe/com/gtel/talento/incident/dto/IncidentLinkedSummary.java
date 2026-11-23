package pe.com.gtel.talento.incident.dto;

public record IncidentLinkedSummary(
    long id, String code, String title, String component, String priority, String status
) {}
