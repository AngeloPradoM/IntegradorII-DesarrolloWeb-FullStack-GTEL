package pe.com.gtel.talento.incident.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ModelAttribute;

import jakarta.validation.Valid;
import pe.com.gtel.talento.incident.dto.IncidentActivityRequest;
import pe.com.gtel.talento.incident.dto.IncidentAssignmentRequest;
import pe.com.gtel.talento.incident.dto.IncidentChangeLinkRequest;
import pe.com.gtel.talento.incident.dto.IncidentClassificationRequest;
import pe.com.gtel.talento.incident.dto.IncidentCreateRequest;
import pe.com.gtel.talento.incident.dto.IncidentConfigurationResponse;
import pe.com.gtel.talento.incident.dto.IncidentDetailResponse;
import pe.com.gtel.talento.incident.dto.IncidentEscalationRequest;
import pe.com.gtel.talento.incident.dto.IncidentEscalationResolveRequest;
import pe.com.gtel.talento.incident.dto.IncidentLinkedSummary;
import pe.com.gtel.talento.incident.dto.IncidentIndicatorsResponse;
import pe.com.gtel.talento.incident.dto.IncidentReportFilter;
import pe.com.gtel.talento.incident.dto.IncidentResolutionRequest;
import pe.com.gtel.talento.incident.dto.IncidentResponse;
import pe.com.gtel.talento.incident.dto.IncidentStatusRequest;
import pe.com.gtel.talento.incident.dto.IncidentTicketLinkRequest;
import pe.com.gtel.talento.incident.service.ProductionIncidentService;
import pe.com.gtel.talento.incident.service.IncidentReportingService;

@RestController
@RequestMapping("/api/production-incidents")
public class ProductionIncidentController {
    private final ProductionIncidentService service;
    private final IncidentReportingService reporting;
    public ProductionIncidentController(ProductionIncidentService service, IncidentReportingService reporting) {
        this.service = service;
        this.reporting = reporting;
    }

    @GetMapping
    public List<IncidentResponse> list(Principal principal) { return service.list(principal.getName()); }

    @GetMapping("/configuration")
    public IncidentConfigurationResponse configuration(Principal principal) {
        return service.configuration(principal.getName());
    }

    @GetMapping("/indicators")
    public IncidentIndicatorsResponse indicators(@Valid @ModelAttribute IncidentReportFilter filter,
                                                  Principal principal) {
        return reporting.indicators(filter, principal.getName());
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> export(@Valid @ModelAttribute IncidentReportFilter filter,
                                         Principal principal) {
        var file = reporting.export(filter, principal.getName());
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .cacheControl(CacheControl.noStore())
            .header(HttpHeaders.CONTENT_DISPOSITION,
                ContentDisposition.attachment().filename(file.filename()).build().toString())
            .body(file.content());
    }

    @GetMapping("/{id}")
    public IncidentDetailResponse detail(@PathVariable long id, Principal principal) {
        return service.detail(id, principal.getName());
    }

    @GetMapping("/linked-to-my-tickets")
    public List<IncidentLinkedSummary> linkedToMyTickets(Principal principal) {
        return service.linkedToRequester(principal.getName());
    }

    @GetMapping("/reported-by-me")
    public List<IncidentResponse> reportedByMe(Principal principal) {
        return service.reportedByRequester(principal.getName());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public IncidentDetailResponse create(@Valid @RequestBody IncidentCreateRequest request, Principal principal) {
        return service.create(request, principal.getName());
    }

    @PatchMapping("/{id}/classification")
    public IncidentDetailResponse classify(@PathVariable long id,
            @Valid @RequestBody IncidentClassificationRequest request, Principal principal) {
        return service.classify(id, request, principal.getName());
    }

    @PatchMapping("/{id}/assignment")
    public IncidentDetailResponse assign(@PathVariable long id,
            @Valid @RequestBody IncidentAssignmentRequest request, Principal principal) {
        return service.assign(id, request, principal.getName());
    }

    @PostMapping("/{id}/activities")
    public IncidentDetailResponse addActivity(@PathVariable long id,
            @Valid @RequestBody IncidentActivityRequest request, Principal principal) {
        return service.addActivity(id, request, principal.getName());
    }

    @PatchMapping("/{id}/resolution")
    public IncidentDetailResponse updateResolution(@PathVariable long id,
            @Valid @RequestBody IncidentResolutionRequest request, Principal principal) {
        return service.updateResolution(id, request, principal.getName());
    }

    @PostMapping("/{id}/escalations")
    public IncidentDetailResponse escalate(@PathVariable long id,
            @Valid @RequestBody IncidentEscalationRequest request, Principal principal) {
        return service.escalate(id, request, principal.getName());
    }

    @PatchMapping("/{id}/escalations/{escalationId}/resolve")
    public IncidentDetailResponse resolveEscalation(@PathVariable long id, @PathVariable long escalationId,
            @Valid @RequestBody IncidentEscalationResolveRequest request, Principal principal) {
        return service.resolveEscalation(id, escalationId, request, principal.getName());
    }

    @PatchMapping("/{id}/status")
    public IncidentDetailResponse transition(@PathVariable long id,
            @Valid @RequestBody IncidentStatusRequest request, Principal principal) {
        return service.transition(id, request, principal.getName());
    }

    @PostMapping("/{id}/tickets/{ticketId}")
    public IncidentDetailResponse linkTicket(@PathVariable long id, @PathVariable long ticketId,
            @Valid @RequestBody IncidentTicketLinkRequest request, Principal principal) {
        return service.linkTicket(id, ticketId, request, principal.getName());
    }

    @DeleteMapping("/{id}/tickets/{ticketId}")
    public IncidentDetailResponse unlinkTicket(@PathVariable long id, @PathVariable long ticketId, Principal principal) {
        return service.unlinkTicket(id, ticketId, principal.getName());
    }

    @PostMapping("/{id}/changes/{changeId}")
    public IncidentDetailResponse linkChange(@PathVariable long id, @PathVariable long changeId,
            @Valid @RequestBody IncidentChangeLinkRequest request, Principal principal) {
        return service.linkChange(id, changeId, request, principal.getName());
    }

    @DeleteMapping("/{id}/changes/{changeId}")
    public IncidentDetailResponse unlinkChange(@PathVariable long id, @PathVariable long changeId, Principal principal) {
        return service.unlinkChange(id, changeId, principal.getName());
    }
}
