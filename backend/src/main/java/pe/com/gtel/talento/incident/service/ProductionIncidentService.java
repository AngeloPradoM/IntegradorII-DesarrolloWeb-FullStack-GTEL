package pe.com.gtel.talento.incident.service;

import java.util.List;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import pe.com.gtel.talento.identity.dto.WorkflowActor;
import pe.com.gtel.talento.identity.service.WorkflowIdentity;
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
import pe.com.gtel.talento.incident.dto.IncidentResolutionRequest;
import pe.com.gtel.talento.incident.dto.IncidentResponse;
import pe.com.gtel.talento.incident.dto.IncidentStatusRequest;
import pe.com.gtel.talento.incident.dto.IncidentTicketLinkRequest;
import pe.com.gtel.talento.incident.repository.IncidentConfigurationRepository;
import pe.com.gtel.talento.incident.repository.ProductionIncidentRepository;
import pe.com.gtel.talento.notification.service.NotificationService;

@Service
@Transactional
public class ProductionIncidentService {
    private final ProductionIncidentRepository repository;
    private final IncidentConfigurationRepository configuration;
    private final IncidentPriorityPolicy priorityPolicy;
    private final IncidentTransitionPolicy transitionPolicy;
    private final IncidentPermissionPolicy permissionPolicy;
    private final IncidentDeduplicationPolicy deduplicationPolicy;
    private final WorkflowIdentity identity;
    private final NotificationService notifications;

    public ProductionIncidentService(ProductionIncidentRepository repository,
                                     IncidentConfigurationRepository configuration,
                                     IncidentPriorityPolicy priorityPolicy,
                                     IncidentTransitionPolicy transitionPolicy, IncidentPermissionPolicy permissionPolicy,
                                     IncidentDeduplicationPolicy deduplicationPolicy, WorkflowIdentity identity,
                                     NotificationService notifications) {
        this.repository = repository;
        this.configuration = configuration;
        this.priorityPolicy = priorityPolicy;
        this.transitionPolicy = transitionPolicy;
        this.permissionPolicy = permissionPolicy;
        this.deduplicationPolicy = deduplicationPolicy;
        this.identity = identity;
        this.notifications = notifications;
    }

    @Transactional(readOnly = true)
    public List<IncidentResponse> list(String email) {
        WorkflowActor actor = identity.actor(email);
        if (!permissionPolicy.canUseOperationalQueue(actor.role())) throw forbidden();
        return switch (actor.role()) {
            case "ADMIN" -> repository.listAll();
            case "TECNICO" -> repository.listForTechnician(actor.id());
            default -> throw forbidden();
        };
    }

    @Transactional(readOnly = true)
    public IncidentConfigurationResponse configuration(String email) {
        WorkflowActor actor = identity.actor(email);
        if (!permissionPolicy.canReadRegistrationConfiguration(actor.role())) throw forbidden();
        var categories = configuration.activeCategories().stream()
            .map(value -> new IncidentConfigurationResponse.Category(value.code(), value.name(), value.moduleCode()))
            .toList();
        var problemTypes = configuration.activeProblemTypes().stream()
            .map(value -> new IncidentConfigurationResponse.ProblemType(value.code(), value.categoryCode(),
                value.name(), value.description(), value.displayOrder()))
            .toList();
        var sla = configuration.activeSlaPolicies().stream()
            .map(value -> new IncidentConfigurationResponse.Sla(value.id(), value.priority(),
                value.firstAttentionMinutes(), value.resolutionMinutes()))
            .toList();
        return new IncidentConfigurationResponse(categories, problemTypes, sla);
    }

    @Transactional(readOnly = true)
    public IncidentDetailResponse detail(long id, String email) {
        WorkflowActor actor = identity.actor(email);
        IncidentResponse incident = requireVisible(id, actor);
        return detail(incident);
    }

    @Transactional(readOnly = true)
    public List<IncidentLinkedSummary> linkedToRequester(String email) {
        WorkflowActor actor = identity.actor(email);
        if (!permissionPolicy.canReadOwnLinkedSummary(actor.role())) throw forbidden();
        return repository.listLinkedForRequester(actor.id());
    }

    @Transactional(readOnly = true)
    public List<IncidentResponse> reportedByRequester(String email) {
        WorkflowActor actor = identity.actor(email);
        if (!permissionPolicy.canReadOwnLinkedSummary(actor.role())) throw forbidden();
        return repository.listForReporter(actor.id());
    }

    public IncidentDetailResponse create(IncidentCreateRequest request, String email) {
        WorkflowActor actor = identity.actor(email);
        if (!permissionPolicy.canRegister(actor.role())) throw forbidden();
        if (request.startedAt() != null && request.startedAt().isAfter(request.detectedAt())) {
            throw bad("El inicio de la afectación no puede ser posterior a su detección.");
        }
        if (request.recoveredAt() != null && request.recoveredAt().isBefore(request.detectedAt())) {
            throw bad("La recuperación declarada no puede ser anterior a la detección.");
        }
        String moduleCode = text(request.moduleCode());
        var category = moduleCode.isBlank() ? null : configuration.categoryForModule(moduleCode);
        if (!moduleCode.isBlank() && category == null) {
            throw bad("Selecciona un módulo activo para clasificar el incidente.");
        }
        String problemTypeCode=text(request.incidentTypeCode());
        if (problemTypeCode.isBlank()) {
            throw bad("Selecciona un tipo de problema técnico activo.");
        }
        var problemType=configuration.problemTypeByCode(problemTypeCode);
        if (problemType == null) {
            throw bad("Selecciona un tipo de problema técnico activo.");
        }
        if (!problemType.code().equals(request.type().trim())) {
            throw bad("El tipo técnico debe corresponder al código de catálogo seleccionado.");
        }
        if (category != null && !category.code().equals(problemType.categoryCode())) {
            throw bad("El tipo de problema no corresponde al módulo seleccionado.");
        }
        category=configuration.categoryByCode(problemType.categoryCode());
        if (category == null) throw bad("La categoría del tipo de problema no está activa.");
        if (request.repeatedFailure()) {
            if (request.previousIncidentId() == null) {
                throw bad("Selecciona el incidente anterior cuando reportas una falla repetida.");
            }
            IncidentResponse previous = requireIncident(request.previousIncidentId());
            if (!same(previous.component(), request.component()) || !same(previous.type(), request.type())) {
                throw bad("La falla repetida debe referenciar un incidente del mismo componente y tipo.");
            }
        } else if (request.previousIncidentId() != null) {
            throw bad("No indiques un incidente anterior si la falla no es repetida.");
        }
        IncidentResponse duplicate = repository.findActivePotentialDuplicate(request.component().trim(), request.type().trim());
        String distinctReason = text(request.distinctReason());
        if (duplicate != null) {
            if (!request.confirmDistinctIncident()) {
                throw conflict("Existe un incidente activo potencialmente relacionado: " + duplicate.code());
            }
            if (!permissionPolicy.canAdminister(actor.role())) {
                throw forbidden();
            }
            if (distinctReason.isBlank()) {
                throw bad("Justifica por qué corresponde registrar un incidente distinto.");
            }
        }
        String suggested = priorityPolicy.suggest(request);
        String suggestedCategory = category == null ? null : category.code();
        String distinctToken = duplicate == null ? null : UUID.randomUUID().toString();
        String deduplicationKey = deduplicationPolicy.key(request.component(), request.type(), distinctToken);
        long id;
        try {
            id = repository.create(actor.id(), request, suggested, suggestedCategory, deduplicationKey);
        } catch (DataIntegrityViolationException exception) {
            throw conflict("Ya existe un incidente activo potencialmente relacionado.");
        }
        repository.addHistory(id, actor.id(), email, null, "REGISTRADO",
            "Incidente registrado manualmente con prioridad sugerida " + suggested
                + (suggestedCategory == null ? ". Categoría pendiente de clasificación" : ". Categoría sugerida " + suggestedCategory)
                + (problemType == null ? "" : ". Tipo de problema " + problemType.code())
                + (duplicate == null ? "" : ". Diferenciado de " + duplicate.code() + ": " + distinctReason));
        identity.audit(actor, "incidentes_produccion", id, "crear", "Incidente de producción registrado");
        notifyRoles(List.of("ADMIN", "TECNICO"), "Nuevo incidente de producción",
            "Se registró un incidente con prioridad sugerida " + suggested + ": " + request.title().trim());
        return detail(requireIncident(id));
    }

    public IncidentDetailResponse classify(long id, IncidentClassificationRequest request, String email) {
        WorkflowActor actor = identity.actor(email);
        if (!permissionPolicy.canAdminister(actor.role())) throw forbidden();
        IncidentResponse incident = requireIncident(id);
        if (!"REGISTRADO".equals(incident.status())) throw conflict("El incidente ya fue clasificado.");
        String reason = text(request.reason());
        if (!request.priority().equals(incident.suggestedPriority()) && reason.isBlank()) {
            throw bad("Justifica la prioridad cuando difiere de la sugerencia automática.");
        }
        String requestedCategory = text(request.categoryCode());
        String finalCategory = requestedCategory.isBlank() ? text(incident.suggestedCategory()) : requestedCategory;
        if (finalCategory.isBlank() || configuration.categoryByCode(finalCategory) == null) {
            throw bad("Selecciona una categoría activa para clasificar el incidente.");
        }
        String categoryReason = text(request.categoryReason());
        if ((incident.suggestedCategory() == null || !finalCategory.equals(incident.suggestedCategory()))
                && categoryReason.isBlank()) {
            throw bad("Justifica la categoría manual cuando difiere de la sugerencia automática.");
        }
        var sla = configuration.slaForPriority(request.priority());
        if (sla == null) throw bad("No existe una política SLA activa para la prioridad seleccionada.");
        var firstAttentionDeadline = incident.detectedAt().plusMinutes(sla.firstAttentionMinutes());
        var resolutionDeadline = incident.detectedAt().plusMinutes(sla.resolutionMinutes());
        if (repository.classify(id, request.priority(), finalCategory, categoryReason, sla.id(),
                firstAttentionDeadline, resolutionDeadline, request.expectedVersion()) == 0) {
            throw conflict("El incidente cambió de estado o versión.");
        }
        String detail = "Prioridad final " + request.priority() + " (sugerida " + incident.suggestedPriority() + ")"
            + ". Categoría " + finalCategory + (reason.isBlank() ? "" : ". Motivo: " + reason)
            + (categoryReason.isBlank() ? "" : ". Motivo de categoría: " + categoryReason);
        repository.addHistory(id, actor.id(), email, incident.status(), "CLASIFICADO", detail);
        identity.audit(actor, "incidentes_produccion", id, "actualizar",
            "Prioridad final " + request.priority() + " (sugerida " + incident.suggestedPriority() + ")"
                + (reason.isBlank() ? "" : ", con justificación"));
        var candidate = configuration.assignmentCandidate(finalCategory, request.priority());
        if (candidate != null) {
            int classifiedVersion = request.expectedVersion() + 1;
            if (repository.assignAutomatically(id, candidate.technicianId(), candidate.ruleId(), classifiedVersion) == 0) {
                throw conflict("El incidente cambió antes de completar la asignación automática.");
            }
            repository.addHistory(id, actor.id(), email, "CLASIFICADO", "ASIGNADO",
                "Asignación automática mediante regla " + candidate.ruleId());
            identity.audit(actor, "incidentes_produccion", id, "actualizar",
                "Técnico asignado automáticamente mediante regla " + candidate.ruleId());
            notifyUser(candidate.technicianId(), "Incidente de producción asignado",
                "Se te asignó automáticamente el incidente " + incident.code() + ".");
        }
        return detail(requireIncident(id));
    }

    public IncidentDetailResponse assign(long id, IncidentAssignmentRequest request, String email) {
        WorkflowActor actor = identity.actor(email);
        if (!permissionPolicy.canAdminister(actor.role())) throw forbidden();
        IncidentResponse incident = requireIncident(id);
        if (!"CLASIFICADO".equals(incident.status())) throw conflict("Clasifica el incidente antes de asignarlo.");
        if (!repository.isActiveTechnician(request.technicianId())) throw bad("Selecciona un técnico activo.");
        if (repository.assign(id, request.technicianId(), request.expectedVersion()) == 0) throw conflict("El incidente cambió de estado o versión.");
        repository.addHistory(id, actor.id(), email, incident.status(), "ASIGNADO", "Técnico responsable asignado");
        identity.audit(actor, "incidentes_produccion", id, "actualizar", "Técnico responsable asignado");
        notifyUser(request.technicianId(), "Incidente de producción asignado",
            "Se te asignó el incidente " + incident.code() + ".");
        return detail(requireIncident(id));
    }

    public IncidentDetailResponse addActivity(long id, IncidentActivityRequest request, String email) {
        WorkflowActor actor = identity.actor(email);
        if (!permissionPolicy.canPerformTechnicalWork(actor.role())) throw forbidden();
        IncidentResponse incident = requireAssigned(id, actor);
        if (List.of("VERIFICADO", "CERRADO").contains(incident.status())) {
            throw conflict("El incidente ya no admite actividad técnica.");
        }
        repository.addActivity(id, actor.id(), email, request.type(), request.detail().trim());
        identity.audit(actor, "incidentes_produccion", id, "actualizar", "Actividad " + request.type() + " registrada");
        return detail(requireIncident(id));
    }

    public IncidentDetailResponse updateResolution(long id, IncidentResolutionRequest request, String email) {
        WorkflowActor actor = identity.actor(email);
        if (!permissionPolicy.canPerformTechnicalWork(actor.role())) throw forbidden();
        IncidentResponse incident = requireAssigned(id, actor);
        if (List.of("VERIFICADO", "CERRADO").contains(incident.status())) {
            throw conflict("La solución ya no puede modificarse en este estado.");
        }
        if (repository.updateResolution(id, request.solutionApplied().trim(), text(request.rootCause()),
                text(request.learning()), request.expectedVersion()) == 0) {
            throw conflict("El incidente cambió de estado o versión.");
        }
        identity.audit(actor, "incidentes_produccion", id, "actualizar",
            "Solución, causa y aprendizaje actualizados");
        return detail(requireIncident(id));
    }

    public IncidentDetailResponse escalate(long id, IncidentEscalationRequest request, String email) {
        WorkflowActor actor = identity.actor(email);
        if (!permissionPolicy.canPerformTechnicalWork(actor.role())
                && !permissionPolicy.canAdminister(actor.role())) {
            throw forbidden();
        }
        IncidentResponse incident = requireIncident(id);
        if (permissionPolicy.canPerformTechnicalWork(actor.role())) {
            requireAssigned(id, actor);
        }
        if (List.of("VERIFICADO", "CERRADO").contains(incident.status())) {
            throw conflict("El incidente ya no admite escalamiento.");
        }
        if (request.destinationUserId() != null
                && !configuration.activeOperationalUserExists(request.destinationUserId())) {
            throw bad("Selecciona un administrador o tÃ©cnico activo como destino del escalamiento.");
        }
        if (repository.touchVersion(id, request.expectedVersion()) == 0) {
            throw conflict("El incidente cambiÃ³ de estado o versiÃ³n.");
        }
        try {
            repository.createEscalation(id, actor.id(), request.destinationUserId(), request.reason().trim());
        } catch (DataIntegrityViolationException exception) {
            throw conflict("El incidente ya tiene un escalamiento activo.");
        }
        repository.addHistory(id, actor.id(), email, incident.status(), incident.status(),
            "Escalamiento registrado: " + request.reason().trim());
        identity.audit(actor, "incidentes_produccion", id, "actualizar", "Escalamiento registrado");
        if (request.destinationUserId() != null) {
            notifyUser(request.destinationUserId(), "Incidente de producciÃ³n escalado",
                incident.code() + " requiere tu atenciÃ³n.");
        } else {
            notifyRoles(List.of("ADMIN"), "Incidente de producciÃ³n escalado",
                incident.code() + " requiere atenciÃ³n administrativa.");
        }
        return detail(requireIncident(id));
    }

    public IncidentDetailResponse resolveEscalation(long id, long escalationId,
                                                     IncidentEscalationResolveRequest request, String email) {
        WorkflowActor actor = admin(email);
        IncidentResponse incident = requireIncident(id);
        if (repository.touchVersion(id, request.expectedVersion()) == 0) {
            throw conflict("El incidente cambiÃ³ de estado o versiÃ³n.");
        }
        if (repository.resolveEscalation(id, escalationId, actor.id(), request.resolution().trim()) == 0) {
            throw conflict("El escalamiento no existe o ya fue resuelto.");
        }
        repository.addHistory(id, actor.id(), email, incident.status(), incident.status(),
            "Escalamiento resuelto: " + request.resolution().trim());
        identity.audit(actor, "incidentes_produccion", id, "actualizar", "Escalamiento resuelto");
        return detail(requireIncident(id));
    }

    public IncidentDetailResponse transition(long id, IncidentStatusRequest request, String email) {
        WorkflowActor actor = identity.actor(email);
        IncidentResponse incident = requireIncident(id);
        validateTransition(actor, incident, request.status());
        Long verifier = "VERIFICADO".equals(request.status()) ? actor.id() : null;
        String deduplicationKey = "EN_INVESTIGACION".equals(request.status())
            ? deduplicationPolicy.key(incident.component(), incident.type(), null) : null;
        try {
            if (repository.transition(id, incident.status(), request.status(), verifier,
                    request.expectedVersion(), deduplicationKey, request.detail().trim()) == 0) {
                throw conflict("El incidente cambió de estado o versión.");
            }
        } catch (DataIntegrityViolationException exception) {
            throw conflict("Existe otro incidente activo para el mismo componente y tipo.");
        }
        repository.addHistory(id, actor.id(), email, incident.status(), request.status(), request.detail().trim());
        identity.audit(actor, "incidentes_produccion", id, "actualizar",
            "Estado " + incident.status() + " → " + request.status());
        if ("SERVICIO_RECUPERADO".equals(request.status())) {
            notifyRoles(List.of("ADMIN"), "Servicio pendiente de verificación",
                incident.code() + " fue marcado como recuperado y requiere verificación.");
        } else if ("CERRADO".equals(request.status())) {
            notifyUser(incident.responsibleId(), "Incidente cerrado", incident.code() + " fue verificado y cerrado.");
        }
        return detail(requireIncident(id));
    }

    public IncidentDetailResponse linkTicket(long id, long ticketId, IncidentTicketLinkRequest request, String email) {
        WorkflowActor actor = admin(email);
        requireIncident(id);
        if (!repository.ticketExists(ticketId)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket no encontrado.");
        if (repository.linkTicket(id, ticketId, request.relationship(), actor.id()) == 0) {
            throw conflict("El ticket ya está vinculado al incidente.");
        }
        identity.audit(actor, "incidentes_produccion", id, "actualizar", "Ticket vinculado: " + ticketId);
        return detail(requireIncident(id));
    }

    public IncidentDetailResponse unlinkTicket(long id, long ticketId, String email) {
        WorkflowActor actor = admin(email);
        requireIncident(id);
        if (repository.unlinkTicket(id, ticketId) == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Vínculo no encontrado.");
        identity.audit(actor, "incidentes_produccion", id, "actualizar", "Ticket desvinculado: " + ticketId);
        return detail(requireIncident(id));
    }

    public IncidentDetailResponse linkChange(long id, long changeId, IncidentChangeLinkRequest request, String email) {
        WorkflowActor actor = admin(email);
        requireIncident(id);
        if (!repository.changeExists(changeId)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "RFC no encontrada.");
        if (repository.linkChange(id, changeId, request.purpose(), actor.id()) == 0) {
            throw conflict("La RFC ya está vinculada al incidente.");
        }
        identity.audit(actor, "incidentes_produccion", id, "actualizar", "RFC vinculada: " + changeId);
        return detail(requireIncident(id));
    }

    public IncidentDetailResponse unlinkChange(long id, long changeId, String email) {
        WorkflowActor actor = admin(email);
        requireIncident(id);
        if (repository.unlinkChange(id, changeId) == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Vínculo no encontrado.");
        identity.audit(actor, "incidentes_produccion", id, "actualizar", "RFC desvinculada: " + changeId);
        return detail(requireIncident(id));
    }

    private void validateTransition(WorkflowActor actor, IncidentResponse incident, String next) {
        if (incident.activeEscalation() && List.of("VERIFICADO", "CERRADO").contains(next)) {
            throw conflict("Resuelve el escalamiento activo antes de verificar o cerrar el incidente.");
        }
        if ("VERIFICADO".equals(next) && text(incident.appliedSolution()).isBlank()) {
            throw conflict("Registra la soluciÃ³n aplicada antes de verificar el incidente.");
        }
        if (permissionPolicy.canPerformTechnicalWork(actor.role())) {
            requireAssigned(incident.id(), actor);
            if (!transitionPolicy.allows(actor.role(), incident.status(), next)) throw conflict("Transición técnica no permitida.");
            return;
        }
        if (!permissionPolicy.canAdminister(actor.role())) throw forbidden();
        if (!transitionPolicy.allows(actor.role(), incident.status(), next)) throw conflict("Transición administrativa no permitida.");
    }

    private IncidentDetailResponse detail(IncidentResponse incident) {
        return new IncidentDetailResponse(incident, repository.activities(incident.id()),
            repository.history(incident.id()), repository.escalations(incident.id()),
            repository.ticketIds(incident.id()), repository.changeIds(incident.id()));
    }

    private IncidentResponse requireVisible(long id, WorkflowActor actor) {
        IncidentResponse incident = requireIncident(id);
        if ("ADMIN".equals(actor.role())) return incident;
        if ("TECNICO".equals(actor.role()) && repository.technicianCanView(id, actor.id())) return incident;
        throw forbidden();
    }

    private IncidentResponse requireAssigned(long id, WorkflowActor actor) {
        IncidentResponse incident = requireIncident(id);
        if (incident.responsibleId() == null || incident.responsibleId() != actor.id()) throw forbidden();
        return incident;
    }

    private IncidentResponse requireIncident(long id) {
        IncidentResponse incident = repository.find(id);
        if (incident == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Incidente no encontrado.");
        return incident;
    }

    private WorkflowActor admin(String email) {
        WorkflowActor actor = identity.actor(email);
        if (!permissionPolicy.canAdminister(actor.role())) throw forbidden();
        return actor;
    }

    private String text(String value) { return value == null ? "" : value.trim(); }
    private boolean same(String left, String right) { return text(left).equalsIgnoreCase(text(right)); }
    private ResponseStatusException forbidden() { return new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permisos para esta operación."); }
    private ResponseStatusException bad(String message) { return new ResponseStatusException(HttpStatus.BAD_REQUEST, message); }
    private ResponseStatusException conflict(String message) { return new ResponseStatusException(HttpStatus.CONFLICT, message); }

    private void notifyRoles(List<String> roles, String title, String message) {
        try { notifications.notifyUsersWithRoles(roles, title, message, "INCIDENTE_PRODUCCION", "/admin/tickets"); }
        catch (RuntimeException ignored) { }
    }

    private void notifyUser(Long id, String title, String message) {
        if (id == null) return;
        try { notifications.notifyUser(id, title, message, "INCIDENTE_PRODUCCION", "/tecnico/tickets"); }
        catch (RuntimeException ignored) { }
    }
}
