package pe.com.gtel.talento.support.dto;

import java.util.List;

public record HelpdeskCatalogResponse(List<RequestType> requestTypes,List<IncidentProblemType> incidentProblemTypes) {
    public record RequestType(String code,String name,String description,String moduleCode,int displayOrder) {}
    public record IncidentProblemType(String code,String categoryCode,String name,String description,int displayOrder) {}
}
