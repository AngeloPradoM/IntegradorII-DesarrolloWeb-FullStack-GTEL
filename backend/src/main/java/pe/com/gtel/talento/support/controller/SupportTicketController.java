package pe.com.gtel.talento.support.controller;

import java.security.Principal;
import java.util.List;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import pe.com.gtel.talento.support.dto.*;
import pe.com.gtel.talento.support.service.SupportTicketService;

@RestController
@RequestMapping("/api/support")
public class SupportTicketController {
    private final SupportTicketService service;
    public SupportTicketController(SupportTicketService service) { this.service = service; }

    @GetMapping("/tickets")
    public List<SupportTicketResponse> list(Principal principal) {
        return service.list(principal.getName());
    }

    @GetMapping("/technicians")
    public List<TechnicianOption> technicians(Principal principal) {
        return service.technicians(principal.getName());
    }

    @PostMapping("/tickets")
    @ResponseStatus(HttpStatus.CREATED)
    public SupportTicketResponse create(@Valid @RequestBody TicketCreateRequest request, Principal principal) {
        return service.create(request, principal.getName());
    }

    @PatchMapping("/tickets/{id}/assignment")
    public SupportTicketResponse assign(@PathVariable long id, @Valid @RequestBody TicketAssignmentRequest request, Principal principal) {
        return service.assign(id, request, principal.getName());
    }

    @PatchMapping("/tickets/{id}/status")
    public SupportTicketResponse updateStatus(@PathVariable long id, @Valid @RequestBody TicketStatusRequest request, Principal principal) {
        return service.updateStatus(id, request, principal.getName());
    }

    @PutMapping("/tickets/{id}/proposal")
    public SupportTicketResponse proposal(@PathVariable long id, @Valid @RequestBody TicketProposalRequest request, Principal principal) {
        return service.proposal(id, request, principal.getName());
    }

    @PatchMapping("/tickets/{id}/decision")
    public SupportTicketResponse decide(@PathVariable long id, @Valid @RequestBody TicketDecisionRequest request, Principal principal) {
        return service.decide(id, request, principal.getName());
    }

    @PutMapping("/tickets/{id}/execution")
    public SupportTicketResponse execute(@PathVariable long id, @Valid @RequestBody TicketExecutionRequest request, Principal principal) {
        return service.execute(id, request, principal.getName());
    }
}
