package pe.com.gtel.talento.support.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.com.gtel.talento.incident.repository.IncidentConfigurationRepository;
import pe.com.gtel.talento.support.dto.HelpdeskCatalogResponse;
import pe.com.gtel.talento.support.dto.HelpdeskCatalogResponse.IncidentProblemType;
import pe.com.gtel.talento.support.dto.HelpdeskCatalogResponse.RequestType;
import pe.com.gtel.talento.support.repository.SupportCatalogRepository;

@Service
public class HelpdeskCatalogService {
    private final SupportCatalogRepository requests;
    private final IncidentConfigurationRepository incidents;

    public HelpdeskCatalogService(SupportCatalogRepository requests,IncidentConfigurationRepository incidents) {
        this.requests=requests; this.incidents=incidents;
    }

    @Transactional(readOnly=true)
    public HelpdeskCatalogResponse activeCatalogs() {
        var requestItems=requests.findAllActive().stream()
            .map(item -> new RequestType(item.code(),item.name(),item.description(),item.moduleCode(),item.displayOrder()))
            .toList();
        var incidentItems=incidents.activeProblemTypes().stream()
            .map(item -> new IncidentProblemType(item.code(),item.categoryCode(),item.name(),item.description(),item.displayOrder()))
            .toList();
        return new HelpdeskCatalogResponse(requestItems,incidentItems);
    }
}
