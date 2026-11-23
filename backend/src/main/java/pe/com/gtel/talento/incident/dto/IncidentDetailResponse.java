package pe.com.gtel.talento.incident.dto;

import java.util.List;

public record IncidentDetailResponse(
    IncidentResponse incident,
    List<IncidentActivityResponse> activities,
    List<IncidentHistoryResponse> history,
    List<IncidentEscalationResponse> escalations,
    List<Long> ticketIds,
    List<Long> changeRequestIds
) {}
