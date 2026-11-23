package pe.com.gtel.talento.support.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

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
import pe.com.gtel.talento.support.repository.SupportCatalogRepository;
import pe.com.gtel.talento.incident.repository.IncidentConfigurationRepository;

@Service
@Transactional
public class SupportTicketService {
    private static final Set<String> EXECUTION_STATES = Set.of("EN_ATENCION", "RESUELTO", "CERRADO");
    private static final Pattern IDEMPOTENCY_KEY = Pattern.compile("[A-Za-z0-9._:-]{16,100}");
    private final SupportTicketRepository repository;
    private final SupportCatalogRepository catalogs;
    private final IncidentConfigurationRepository incidentCatalogs;
    private final WorkflowIdentity identity;
    private final NotificationService notifications;

    public SupportTicketService(SupportTicketRepository repository, SupportCatalogRepository catalogs,
                                IncidentConfigurationRepository incidentCatalogs,
                                WorkflowIdentity identity, NotificationService notifications) {
        this.repository = repository;
        this.catalogs = catalogs;
        this.incidentCatalogs = incidentCatalogs;
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
        return create(request,email,null);
    }

    public SupportTicketResponse create(TicketCreateRequest request, String email, String idempotencyKey) {
        WorkflowActor actor = identity.actor(email);
        requireRole(actor, "RECLUTADOR");
        PreparedTicket prepared = prepareForPersistence(request);
        String key=normalizeIdempotencyKey(idempotencyKey);
        boolean structured=normalized(request.requestTypeCode()) != null || normalized(request.incidentTypeCode()) != null;
        if (structured && key == null) throw bad("Falta la clave de idempotencia del envío.");
        String requestHash=key == null ? null : requestHash(request,prepared);
        if (key != null && !repository.reserveCreation(actor.id(),key,requestHash)) {
            var previous=repository.findCreation(actor.id(),key);
            if (previous == null || !requestHash.equals(previous.requestHash())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La clave de idempotencia ya fue utilizada con otro contenido.");
            }
            if (previous.ticketId() == null) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La solicitud con esta clave todavía se está procesando.");
            }
            return requireTicket(previous.ticketId());
        }
        long id = repository.create(actor.id(), request, prepared.priority(), prepared.category(),
            prepared.subcategory(), prepared.priorityJustification());
        String structuredCode = "SOLICITUD".equals(request.attentionType())
            ? normalized(request.requestTypeCode()) : normalized(request.incidentTypeCode());
        repository.addHistory(id, actor.id(), null, "NUEVO", "Ticket enviado a la bandeja técnica"
            + (structuredCode == null ? "" : " con tipo " + structuredCode));
        if (key != null) repository.completeCreation(actor.id(),key,id);
        identity.audit(actor, "tickets_soporte", id, "crear", "Ticket de soporte creado");
        String notificationMessage = "Se registró una " + request.attentionType().toLowerCase() + " de reclutamiento: " + request.title().trim();
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
    private PreparedTicket prepareForPersistence(TicketCreateRequest request) {
        String requestType=normalized(request.requestTypeCode());
        String incidentType=normalized(request.incidentTypeCode());
        if (requestType == null && incidentType == null) {
            return new PreparedTicket(request.priority(), request.category().trim(),
                request.subcategory().trim(), request.priorityJustification().trim());
        }
        if ("SOLICITUD".equals(request.attentionType())) {
            var type = requestType == null ? null : catalogs.findActive(requestType);
            if (type == null || incidentType != null) {
                throw bad("Selecciona un tipo de solicitud activo y compatible.");
            }
            requireStructuredAnswers(request);
            String priority = calculateRequestPriority(request);
            String justification = "Clasificación automática del servidor. Código: " + type.code()
                + ". Alcance: " + request.scope() + ". Impacto: " + request.impact()
                + ". Urgencia: " + request.urgency() + ". Continuidad: "
                + (Boolean.TRUE.equals(request.blocksWork()) ? "BLOQUEADA" : "DISPONIBLE")
                + ". Frecuencia: " + request.frequency() + ". Prioridad: " + priority + ".";
            return new PreparedTicket(priority, type.moduleCode(), type.name(), justification);
        }
        var problemType = incidentType == null ? null : incidentCatalogs.problemTypeByCode(incidentType);
        if (problemType == null || requestType != null) {
            throw bad("Selecciona un tipo de problema técnico compatible.");
        }
        var category = incidentCatalogs.categoryByCode(problemType.categoryCode());
        if (category == null) throw bad("La categoría del problema técnico no está activa.");
        requireStructuredAnswers(request);
        String priority = calculateRequestPriority(request);
        String justification = "Clasificación automática del servidor. Código: " + problemType.code()
            + ". Categoría: " + category.code() + ". Alcance: " + request.scope()
            + ". Impacto: " + request.impact() + ". Urgencia: " + request.urgency()
            + ". Continuidad: " + (Boolean.TRUE.equals(request.blocksWork()) ? "BLOQUEADA" : "DISPONIBLE")
            + ". Frecuencia: " + request.frequency() + ". Prioridad de ticket: " + priority
            + ". La prioridad P1-P4 corresponde únicamente al incidente operativo relacionado.";
        return new PreparedTicket(priority, category.moduleCode(), problemType.name(), justification);
    }
    private void requireStructuredAnswers(TicketCreateRequest request) {
        if (normalized(request.scope()) == null || normalized(request.impact()) == null
                || normalized(request.urgency()) == null || request.blocksWork() == null
                || normalized(request.frequency()) == null) {
            throw bad("Completa alcance, impacto, urgencia, continuidad y frecuencia.");
        }
    }
    private String calculateRequestPriority(TicketCreateRequest request) {
        boolean blocks = Boolean.TRUE.equals(request.blocksWork());
        if (!"UN_USUARIO".equals(request.scope())) return "ALTA";
        if (blocks && (!"BAJO".equals(request.impact()) || "ALTA".equals(request.urgency()))) return "ALTA";
        if (blocks || !"BAJO".equals(request.impact()) || !"BAJA".equals(request.urgency())) return "MEDIA";
        return "BAJA";
    }
    private String normalized(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private String normalizeIdempotencyKey(String value) {
        String key=normalized(value);
        if (key == null) return null;
        if (!IDEMPOTENCY_KEY.matcher(key).matches()) {
            throw bad("La clave de idempotencia tiene un formato inválido.");
        }
        return key;
    }
    private String requestHash(TicketCreateRequest request, PreparedTicket prepared) {
        String canonical=String.join("\u001f",
            safe(request.title()),safe(request.attentionType()),safe(request.description()),
            safe(request.requestTypeCode()),safe(request.incidentTypeCode()),safe(request.originChannel()),
            safe(request.scope()),safe(request.impact()),safe(request.urgency()),
            String.valueOf(request.blocksWork()),safe(request.frequency()),
            prepared.priority(),prepared.category(),prepared.subcategory(),prepared.priorityJustification());
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                .digest(canonical.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException("SHA-256 no está disponible",impossible);
        }
    }
    private String safe(String value) { return value == null ? "" : value.trim(); }
    private ResponseStatusException forbidden() { return new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permisos para esta operación."); }
    private ResponseStatusException bad(String message) { return new ResponseStatusException(HttpStatus.BAD_REQUEST, message); }
    private void notifyRoles(List<String> roles, String title, String message, String link) {
        try { notifications.notifyUsersWithRoles(roles, title, message, "SOPORTE_TICKET", link); } catch (RuntimeException ignored) { }
    }
    private void notifyUser(Long id, String title, String message, String link) {
        if (id == null) return;
        try { notifications.notifyUser(id, title, message, "SOPORTE_TICKET", link); } catch (RuntimeException ignored) { }
    }
    private record PreparedTicket(String priority, String category, String subcategory,
                                  String priorityJustification) {}
}
