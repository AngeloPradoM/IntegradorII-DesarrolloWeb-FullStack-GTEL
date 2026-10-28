package pe.com.gtel.talento.support.service;

import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import pe.com.gtel.talento.identity.dto.WorkflowActor;
import pe.com.gtel.talento.identity.service.WorkflowIdentity;
import pe.com.gtel.talento.notification.service.NotificationService;
import pe.com.gtel.talento.support.dto.SupportTicketDashboardDTO;
import pe.com.gtel.talento.support.dto.SupportTicketResponse;
import pe.com.gtel.talento.support.dto.TechnicianOption;
import pe.com.gtel.talento.support.dto.TicketAssignmentRequest;
import pe.com.gtel.talento.support.dto.TicketCreateRequest;
import pe.com.gtel.talento.support.dto.TicketDecisionRequest;
import pe.com.gtel.talento.support.dto.TicketExecutionRequest;
import pe.com.gtel.talento.support.dto.TicketProposalRequest;
import pe.com.gtel.talento.support.dto.TicketStatusRequest;
import pe.com.gtel.talento.support.repository.SupportTicketRepository;

@Service
@Transactional
public class SupportTicketService {
    private static final Set<String> EXECUTION_STATES = Set.of("EN_ATENCION", "RESUELTO", "CERRADO");
    private final SupportTicketRepository repository;
    private final WorkflowIdentity identity;
    private final NotificationService notifications;

    public SupportTicketService(SupportTicketRepository repository, WorkflowIdentity identity, NotificationService notifications) {
        this.repository = repository;
        this.identity = identity;
        this.notifications = notifications;
    }

    @Transactional(readOnly = true)
    public List<SupportTicketResponse> list(String email) {
        WorkflowActor actor = identity.actor(email);
        return switch (actor.role()) {
            case "ADMIN" -> repository.listAll();
            case "RECLUTADOR" -> repository.listForRequester(actor.id());
            case "TECNICO" -> repository.listForTechnician(actor.id());
            default -> throw forbidden();
        };
    }
    @Transactional(readOnly = true)
    public List<SupportTicketDashboardDTO> getDashboard(String email) {
        WorkflowActor actor = identity.actor(email);
        requireRole(actor, "ADMIN"); 
        return repository.getDashboardBoard();
    }

    @Transactional(readOnly = true)
    public List<SupportTicketDashboardDTO> getTechnicianDashboard(String email) {
        WorkflowActor actor = identity.actor(email);
        requireRole(actor, "TECNICO");
        return repository.getDashboardBoard(actor.id());
    }

    @Transactional(readOnly = true)
    public List<TechnicianOption> technicians(String email) {
        requireRole(identity.actor(email), "ADMIN");
        return repository.technicians();
    }

    public SupportTicketResponse create(TicketCreateRequest request, String email) {
        WorkflowActor actor = identity.actor(email);
        requireRole(actor, "RECLUTADOR");
        long id = repository.create(actor.id(), request);
        repository.addHistory(id, actor.id(), null, "NUEVO", "Ticket enviado a la bandeja técnica");
        identity.audit(actor, "tickets_soporte", id, "crear", "Ticket de soporte creado");
        String notificationMessage = "Se registró una incidencia de reclutamiento: " + request.title().trim();
        notifyRoles(List.of("TECNICO"), "Nuevo ticket de soporte", notificationMessage, "/tecnico/tickets");
        notifyRoles(List.of("ADMIN"), "Nuevo ticket de soporte", notificationMessage, "/admin/tickets");
        return requireTicket(id);
    }

    public SupportTicketResponse assign(long id, TicketAssignmentRequest request, String email) {
        WorkflowActor actor = identity.actor(email);
        requireRole(actor, "ADMIN");
        SupportTicketResponse ticket = requireTicket(id);
        if (!repository.isActiveTechnician(request.technicianId())) {
            throw bad("Selecciona un técnico activo.");
        }
        repository.assign(id, request.technicianId());
        repository.addHistory(id, actor.id(), ticket.status(), "ASIGNADO", "Técnico asignado por administración");
        identity.audit(actor, "tickets_soporte", id, "actualizar", "Técnico asignado");
        notifyUser(request.technicianId(), "Ticket asignado", "Se te asignó el ticket " + ticket.code() + ".", "/tecnico/tickets");
        return requireTicket(id);
    }

    public SupportTicketResponse updateStatus(long id, TicketStatusRequest request, String email) {
        WorkflowActor actor = identity.actor(email);
        requireRole(actor, "TECNICO");
        SupportTicketResponse ticket = requireAssignedTicket(id, actor);
        if (EXECUTION_STATES.contains(request.status()) && !"APROBADA".equals(ticket.proposalStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La ejecución todavía no fue autorizada por administración.");
        }
        repository.updateStatus(id, request.status());
        repository.addHistory(id, actor.id(), ticket.status(), request.status(), "Estado actualizado por soporte técnico");
        identity.audit(actor, "tickets_soporte", id, "actualizar", "Estado: " + request.status());
        return requireTicket(id);
    }

    public SupportTicketResponse proposal(long id, TicketProposalRequest request, String email) {
        WorkflowActor actor = identity.actor(email);
        requireRole(actor, "TECNICO");
        SupportTicketResponse ticket = requireAssignedTicket(id, actor);
        if ("APROBADA".equals(ticket.proposalStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La propuesta ya fue aprobada.");
        }
        repository.saveProposal(id, request.diagnosis().trim(), request.proposedSolution().trim());
        repository.addHistory(id, actor.id(), ticket.status(), "EN_ESPERA", "Propuesta enviada para autorización");
        identity.audit(actor, "tickets_soporte", id, "actualizar", "Propuesta técnica enviada");
        notifyRoles(List.of("ADMIN"), "Propuesta técnica pendiente",
            "El ticket " + ticket.code() + " requiere autorización administrativa.", "/admin/tickets");
        return requireTicket(id);
    }

    public SupportTicketResponse decide(long id, TicketDecisionRequest request, String email) {
        WorkflowActor actor = identity.actor(email);
        requireRole(actor, "ADMIN");
        SupportTicketResponse ticket = requireTicket(id);
        if (!"PENDIENTE".equals(ticket.proposalStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El ticket no tiene una propuesta pendiente.");
        }
        if (request.approved() && ticket.technicianId() == null) {
            throw bad("Asigna un técnico antes de autorizar la ejecución.");
        }
        String comment = request.comment() == null ? "" : request.comment().trim();
        if (!request.approved() && comment.isBlank()) {
            throw bad("Indica el motivo para solicitar ajustes.");
        }
        repository.decide(id, request.approved(), comment);
        repository.addHistory(id, actor.id(), ticket.status(), "ASIGNADO",
            request.approved() ? "Ejecución autorizada" : "Propuesta devuelta para ajustes");
        identity.audit(actor, "tickets_soporte", id, "actualizar",
            request.approved() ? "Ejecución autorizada" : "Propuesta rechazada");
        notifyUser(ticket.technicianId(), request.approved() ? "Ejecución autorizada" : "Propuesta con observaciones",
            request.approved() ? "Ya puedes ejecutar la solución del ticket " + ticket.code() + "."
                : "Revisa la propuesta del ticket " + ticket.code() + ": " + comment,
            "/tecnico/tickets");
        return requireTicket(id);
    }

    public SupportTicketResponse execute(long id, TicketExecutionRequest request, String email) {
        WorkflowActor actor = identity.actor(email);
        requireRole(actor, "TECNICO");
        SupportTicketResponse ticket = requireAssignedTicket(id, actor);
        if (!"APROBADA".equals(ticket.proposalStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Administración debe autorizar la ejecución.");
        }
        repository.saveExecution(id, request.evidence().trim());
        repository.addHistory(id, actor.id(), ticket.status(), "RESUELTO", "Ejecución registrada con evidencia");
        identity.audit(actor, "tickets_soporte", id, "actualizar", "Ticket resuelto por soporte técnico");
        notifyUser(ticket.requesterId(), "Ticket resuelto", "El ticket " + ticket.code() + " fue resuelto por soporte técnico.", "/reclutador/tickets");
        return requireTicket(id);
    }

    private SupportTicketResponse requireAssignedTicket(long id, WorkflowActor actor) {
        SupportTicketResponse ticket = requireTicket(id);
        if (ticket.technicianId() == null || ticket.technicianId() != actor.id()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El ticket no está asignado a tu cuenta.");
        }
        return ticket;
    }

    private SupportTicketResponse requireTicket(long id) {
        SupportTicketResponse ticket = repository.find(id);
        if (ticket == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket no encontrado.");
        return ticket;
    }

    private void requireRole(WorkflowActor actor, String role) {
        if (!role.equals(actor.role())) throw forbidden();
    }
    private ResponseStatusException forbidden() { return new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permisos para esta operación."); }
    private ResponseStatusException bad(String message) { return new ResponseStatusException(HttpStatus.BAD_REQUEST, message); }
    private void notifyRoles(List<String> roles, String title, String message, String link) {
        try { notifications.notifyUsersWithRoles(roles, title, message, "SOPORTE_TICKET", link); } catch (RuntimeException ignored) { }
    }
    private void notifyUser(Long id, String title, String message, String link) {
        if (id == null) return;
        try { notifications.notifyUser(id, title, message, "SOPORTE_TICKET", link); } catch (RuntimeException ignored) { }
    }
}
