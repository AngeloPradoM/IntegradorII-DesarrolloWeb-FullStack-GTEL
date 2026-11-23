package pe.com.gtel.talento.incident.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import pe.com.gtel.talento.identity.dto.WorkflowActor;
import pe.com.gtel.talento.identity.service.WorkflowIdentity;
import pe.com.gtel.talento.incident.dto.IncidentAssignmentRequest;
import pe.com.gtel.talento.incident.dto.IncidentChangeLinkRequest;
import pe.com.gtel.talento.incident.dto.IncidentClassificationRequest;
import pe.com.gtel.talento.incident.dto.IncidentCreateRequest;
import pe.com.gtel.talento.incident.dto.IncidentEscalationRequest;
import pe.com.gtel.talento.incident.dto.IncidentEscalationResolveRequest;
import pe.com.gtel.talento.incident.dto.IncidentLinkedSummary;
import pe.com.gtel.talento.incident.dto.IncidentResolutionRequest;
import pe.com.gtel.talento.incident.dto.IncidentResponse;
import pe.com.gtel.talento.incident.dto.IncidentStatusRequest;
import pe.com.gtel.talento.incident.dto.IncidentTicketLinkRequest;
import pe.com.gtel.talento.incident.repository.IncidentConfigurationRepository;
import pe.com.gtel.talento.incident.repository.IncidentConfigurationRepository.AssignmentCandidate;
import pe.com.gtel.talento.incident.repository.IncidentConfigurationRepository.CategoryConfiguration;
import pe.com.gtel.talento.incident.repository.IncidentConfigurationRepository.SlaConfiguration;
import pe.com.gtel.talento.incident.repository.IncidentConfigurationRepository.ProblemTypeConfiguration;
import pe.com.gtel.talento.incident.repository.ProductionIncidentRepository;
import pe.com.gtel.talento.notification.service.NotificationService;

@ExtendWith(MockitoExtension.class)
class ProductionIncidentServiceTest {
    private static final String CATEGORY = "DISPONIBILIDAD_PLATAFORMA";

    @Mock private ProductionIncidentRepository repository;
    @Mock private IncidentConfigurationRepository configuration;
    @Mock private WorkflowIdentity identity;
    @Mock private NotificationService notifications;
    private ProductionIncidentService service;

    @BeforeEach
    void setUp() {
        service = new ProductionIncidentService(repository, configuration, new IncidentPriorityPolicy(),
            new IncidentTransitionPolicy(), new IncidentPermissionPolicy(),
            new IncidentDeduplicationPolicy(), identity, notifications);
    }

    @Test
    void creationPersistsSuggestedCategoryPriorityHistoryAndAudit() {
        WorkflowActor admin = new WorkflowActor(1L, "ADMIN");
        IncidentCreateRequest request = request("GENERAL", "CRITICO", "INMEDIATA", true, false, true);
        IncidentResponse created = incident("REGISTRADO", null, 0, null);
        when(identity.actor("admin@gtel.test")).thenReturn(admin);
        when(configuration.categoryForModule("AVAILABILITY"))
            .thenReturn(new CategoryConfiguration(CATEGORY, "Disponibilidad de plataforma", "AVAILABILITY"));
        when(configuration.problemTypeByCode("INC_PLATAFORMA_CAIDA"))
            .thenReturn(new ProblemTypeConfiguration("INC_PLATAFORMA_CAIDA", CATEGORY,
                "Plataforma caída", "Interrupción total", 10));
        when(configuration.categoryByCode(CATEGORY))
            .thenReturn(new CategoryConfiguration(CATEGORY, "Disponibilidad de plataforma", "AVAILABILITY"));
        when(repository.create(eq(1L), eq(request), eq("P1"), eq(CATEGORY), anyString())).thenReturn(9L);
        when(repository.find(9L)).thenReturn(created);

        var result = service.create(request, "admin@gtel.test");

        assertEquals("P1", result.incident().suggestedPriority());
        assertEquals(CATEGORY, result.incident().suggestedCategory());
        verify(repository).addHistory(9L, 1L, "admin@gtel.test", null, "REGISTRADO",
            "Incidente registrado manualmente con prioridad sugerida P1. Categoría sugerida " + CATEGORY
                + ". Tipo de problema INC_PLATAFORMA_CAIDA");
        verify(identity).audit(admin, "incidentes_produccion", 9L, "crear",
            "Incidente de producción registrado");
    }

    @Test
    void recruiterCannotCreateOperationalIncidentDirectly() {
        WorkflowActor recruiter = new WorkflowActor(15L, "RECLUTADOR");
        IncidentCreateRequest request = request("GENERAL", "CRITICO", "INMEDIATA", true, false, true);
        when(identity.actor("recruiter@gtel.test")).thenReturn(recruiter);
        assertEquals(HttpStatus.FORBIDDEN, assertThrows(ResponseStatusException.class,
            () -> service.create(request, "recruiter@gtel.test")).getStatusCode());
        verifyNoInteractions(repository, configuration);
    }

    @Test
    void rejectsProblemTypeThatDoesNotBelongToSelectedModule() {
        WorkflowActor admin=new WorkflowActor(1L,"ADMIN");
        IncidentCreateRequest base=request("GENERAL","ALTO","ALTA",true,false,true);
        IncidentCreateRequest structured=new IncidentCreateRequest(base.title(),base.component(),"INC_ERROR_LOGIN",
            base.moduleCode(),base.description(),base.scope(),base.impact(),base.urgency(),
            base.essentialProcess(),base.workaroundAvailable(),base.serviceBlocked(),base.repeatedFailure(),
            base.previousIncidentId(),base.detectedAt(),base.startedAt(),base.confirmDistinctIncident(),
            base.distinctReason(),"INC_ERROR_LOGIN");
        when(identity.actor("admin@gtel.test")).thenReturn(admin);
        when(configuration.categoryForModule("AVAILABILITY"))
            .thenReturn(new CategoryConfiguration(CATEGORY,"Disponibilidad","AVAILABILITY"));
        when(configuration.problemTypeByCode("INC_ERROR_LOGIN"))
            .thenReturn(new ProblemTypeConfiguration("INC_ERROR_LOGIN","ACCESO_AUTENTICACION",
                "Error de acceso","Error técnico",10));

        ResponseStatusException error=assertThrows(ResponseStatusException.class,
            () -> service.create(structured,"admin@gtel.test"));

        assertEquals(HttpStatus.BAD_REQUEST,error.getStatusCode());
        verify(repository,never()).create(eq(1L),eq(structured),anyString(),anyString(),anyString());
    }

    @Test
    void classificationPersistsSlaAndUsesRealAutomaticAssignmentRule() {
        WorkflowActor admin = new WorkflowActor(1L, "ADMIN");
        IncidentResponse registered = incident("REGISTRADO", null, 2, null);
        IncidentResponse assigned = incident("ASIGNADO", "P1", 4, 22L);
        LocalDateTime detected = registered.detectedAt();
        when(identity.actor("admin@gtel.test")).thenReturn(admin);
        when(repository.find(9L)).thenReturn(registered, assigned);
        when(configuration.categoryByCode(CATEGORY))
            .thenReturn(new CategoryConfiguration(CATEGORY, "Disponibilidad de plataforma", "AVAILABILITY"));
        when(configuration.slaForPriority("P1")).thenReturn(new SlaConfiguration(1L, "P1", 15, 240));
        when(configuration.assignmentCandidate(CATEGORY, "P1"))
            .thenReturn(new AssignmentCandidate(7L, 22L, "tech@gtel.test", 100, 0));
        when(repository.classify(9L, "P1", CATEGORY, "", 1L, detected.plusMinutes(15),
            detected.plusMinutes(240), 2)).thenReturn(1);
        when(repository.assignAutomatically(9L, 22L, 7L, 3)).thenReturn(1);

        var result = service.classify(9L,
            new IncidentClassificationRequest("P1", "", CATEGORY, "", 2), "admin@gtel.test");

        assertEquals("ASIGNADO", result.incident().status());
        verify(repository).addHistory(9L, 1L, "admin@gtel.test", "CLASIFICADO", "ASIGNADO",
            "Asignación automática mediante regla 7");
        verify(identity).audit(admin, "incidentes_produccion", 9L, "actualizar",
            "Técnico asignado automáticamente mediante regla 7");
    }

    @Test
    void staleClassificationDoesNotWriteHistoryOrAudit() {
        WorkflowActor admin = new WorkflowActor(1L, "ADMIN");
        IncidentResponse registered = incident("REGISTRADO", null, 3, null);
        when(identity.actor("admin@gtel.test")).thenReturn(admin);
        when(repository.find(9L)).thenReturn(registered);
        when(configuration.categoryByCode(CATEGORY))
            .thenReturn(new CategoryConfiguration(CATEGORY, "Disponibilidad de plataforma", "AVAILABILITY"));
        when(configuration.slaForPriority("P1")).thenReturn(new SlaConfiguration(1L, "P1", 15, 240));
        when(repository.classify(9L, "P1", CATEGORY, "", 1L, registered.detectedAt().plusMinutes(15),
            registered.detectedAt().plusMinutes(240), 2)).thenReturn(0);

        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> service.classify(
            9L, new IncidentClassificationRequest("P1", "", CATEGORY, "", 2), "admin@gtel.test"));

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        verify(repository, never()).addHistory(eq(9L), eq(1L), anyString(), anyString(), anyString(), anyString());
        verify(identity, never()).audit(eq(admin), eq("incidentes_produccion"), eq(9L), eq("actualizar"), anyString());
    }

    @Test
    void technicianCannotClassifyAssignOrLinkRelationships() {
        when(identity.actor("tech@gtel.test")).thenReturn(new WorkflowActor(22L, "TECNICO"));

        assertEquals(HttpStatus.FORBIDDEN, assertThrows(ResponseStatusException.class, () -> service.classify(
            9L, new IncidentClassificationRequest("P2", "", CATEGORY, "", 0), "tech@gtel.test")).getStatusCode());
        assertEquals(HttpStatus.FORBIDDEN, assertThrows(ResponseStatusException.class, () -> service.assign(
            9L, new IncidentAssignmentRequest(22L, 0), "tech@gtel.test")).getStatusCode());
        assertEquals(HttpStatus.FORBIDDEN, assertThrows(ResponseStatusException.class, () -> service.linkTicket(
            9L, 12L, new IncidentTicketLinkRequest("ORIGEN"), "tech@gtel.test")).getStatusCode());
        verifyNoInteractions(repository);
    }

    @Test
    void assignedTechnicianTransitionPersistsFirstAttentionHistoryAndAudit() {
        WorkflowActor technician = new WorkflowActor(22L, "TECNICO");
        IncidentResponse assigned = incident("ASIGNADO", "P2", 2, 22L);
        IncidentResponse investigating = incident("EN_INVESTIGACION", "P2", 3, 22L);
        when(identity.actor("tech@gtel.test")).thenReturn(technician);
        when(repository.find(9L)).thenReturn(assigned, assigned, investigating);
        when(repository.transition(eq(9L), eq("ASIGNADO"), eq("EN_INVESTIGACION"), isNull(), eq(2),
            anyString(), eq("Diagnóstico iniciado"))).thenReturn(1);

        var result = service.transition(9L,
            new IncidentStatusRequest("EN_INVESTIGACION", "Diagnóstico iniciado", 2), "tech@gtel.test");

        assertEquals("EN_INVESTIGACION", result.incident().status());
        verify(repository).addHistory(9L, 22L, "tech@gtel.test", "ASIGNADO", "EN_INVESTIGACION",
            "Diagnóstico iniciado");
        verify(identity).audit(technician, "incidentes_produccion", 9L, "actualizar",
            "Estado ASIGNADO → EN_INVESTIGACION");
    }

    @Test
    void differentTechnicianCannotOperateAssignedIncident() {
        when(identity.actor("other@gtel.test")).thenReturn(new WorkflowActor(23L, "TECNICO"));
        when(repository.find(9L)).thenReturn(incident("ASIGNADO", "P2", 2, 22L));

        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> service.transition(
            9L, new IncidentStatusRequest("EN_INVESTIGACION", "Intento", 2), "other@gtel.test"));

        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
        verify(repository, never()).transition(eq(9L), anyString(), anyString(), isNull(), eq(2),
            anyString(), anyString());
    }

    @Test
    void staleResolutionIsRejectedWithoutAudit() {
        WorkflowActor technician = new WorkflowActor(22L, "TECNICO");
        IncidentResponse assigned = incident("EN_INVESTIGACION", "P2", 4, 22L);
        when(identity.actor("tech@gtel.test")).thenReturn(technician);
        when(repository.find(9L)).thenReturn(assigned);
        when(repository.updateResolution(9L, "Reinicio controlado", "Bloqueo", "Agregar alerta", 3)).thenReturn(0);

        var error = assertThrows(ResponseStatusException.class, () -> service.updateResolution(9L,
            new IncidentResolutionRequest("Reinicio controlado", "Bloqueo", "Agregar alerta", 3),
            "tech@gtel.test"));

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        verify(identity, never()).audit(eq(technician), eq("incidentes_produccion"), eq(9L),
            eq("actualizar"), anyString());
    }

    @Test
    void assignedTechnicianSavesResolutionWithExpectedVersionAndAudit() {
        WorkflowActor technician = new WorkflowActor(22L, "TECNICO");
        IncidentResponse investigating = incident("EN_INVESTIGACION", "P2", 4, 22L);
        IncidentResponse updated = incident("EN_INVESTIGACION", "P2", 5, 22L,
            "Reinicio controlado", false);
        when(identity.actor("tech@gtel.test")).thenReturn(technician);
        when(repository.find(9L)).thenReturn(investigating, updated);
        when(repository.updateResolution(9L, "Reinicio controlado", "Bloqueo", "Agregar alerta", 4))
            .thenReturn(1);

        var result = service.updateResolution(9L,
            new IncidentResolutionRequest("Reinicio controlado", "Bloqueo", "Agregar alerta", 4),
            "tech@gtel.test");

        assertEquals("Reinicio controlado", result.incident().appliedSolution());
        assertEquals(5, result.incident().version());
        verify(identity).audit(technician, "incidentes_produccion", 9L, "actualizar",
            "Soluci\u00f3n, causa y aprendizaje actualizados");
    }

    @Test
    void assignedTechnicianEscalatesWithOptimisticVersionAndAudit() {
        WorkflowActor technician = new WorkflowActor(22L, "TECNICO");
        IncidentResponse assigned = incident("EN_INVESTIGACION", "P2", 4, 22L);
        IncidentResponse escalated = incident("EN_INVESTIGACION", "P2", 5, 22L);
        when(identity.actor("tech@gtel.test")).thenReturn(technician);
        when(repository.find(9L)).thenReturn(assigned, assigned, escalated);
        when(repository.touchVersion(9L, 4)).thenReturn(1);
        when(repository.createEscalation(9L, 22L, null, "Requiere acceso de infraestructura")).thenReturn(3L);

        var result = service.escalate(9L,
            new IncidentEscalationRequest(null, "Requiere acceso de infraestructura", 4), "tech@gtel.test");

        assertEquals(5, result.incident().version());
        verify(repository).addHistory(9L, 22L, "tech@gtel.test", "EN_INVESTIGACION", "EN_INVESTIGACION",
            "Escalamiento registrado: Requiere acceso de infraestructura");
        verify(identity).audit(technician, "incidentes_produccion", 9L, "actualizar",
            "Escalamiento registrado");
    }

    @Test
    void administratorResolvesEscalationWithOptimisticVersion() {
        WorkflowActor admin = new WorkflowActor(1L, "ADMIN");
        IncidentResponse incident = incident("EN_INVESTIGACION", "P2", 5, 22L);
        IncidentResponse resolved = incident("EN_INVESTIGACION", "P2", 6, 22L);
        when(identity.actor("admin@gtel.test")).thenReturn(admin);
        when(repository.find(9L)).thenReturn(incident, resolved);
        when(repository.touchVersion(9L, 5)).thenReturn(1);
        when(repository.resolveEscalation(9L, 3L, 1L, "Capacidad habilitada")).thenReturn(1);

        var result = service.resolveEscalation(9L, 3L,
            new IncidentEscalationResolveRequest("Capacidad habilitada", 5), "admin@gtel.test");

        assertEquals(6, result.incident().version());
        verify(identity).audit(admin, "incidentes_produccion", 9L, "actualizar", "Escalamiento resuelto");
    }

    @Test
    void administratorCannotVerifyIncidentWithoutAppliedSolution() {
        WorkflowActor admin = new WorkflowActor(1L, "ADMIN");
        IncidentResponse recovered = incident("SERVICIO_RECUPERADO", "P2", 5, 22L);
        when(identity.actor("admin@gtel.test")).thenReturn(admin);
        when(repository.find(9L)).thenReturn(recovered);

        var error = assertThrows(ResponseStatusException.class, () -> service.transition(9L,
            new IncidentStatusRequest("VERIFICADO", "ValidaciÃ³n funcional", 5), "admin@gtel.test"));

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        verify(repository, never()).transition(eq(9L), anyString(), anyString(), eq(1L), eq(5),
            anyString(), anyString());
    }

    @Test
    void administratorVerifiesAndClosesRecoveredIncidentWithHistoryAndVersions() {
        WorkflowActor admin = new WorkflowActor(1L, "ADMIN");
        IncidentResponse recovered = incident("SERVICIO_RECUPERADO", "P2", 5, 22L, "Reinicio", false);
        IncidentResponse verified = incident("VERIFICADO", "P2", 6, 22L, "Reinicio", false);
        IncidentResponse closed = incident("CERRADO", "P2", 7, 22L, "Reinicio", false);
        when(identity.actor("admin@gtel.test")).thenReturn(admin);
        when(repository.find(9L)).thenReturn(recovered, verified, verified, closed);
        when(repository.transition(9L, "SERVICIO_RECUPERADO", "VERIFICADO", 1L, 5,
            null, "Servicio estable")).thenReturn(1);
        when(repository.transition(9L, "VERIFICADO", "CERRADO", null, 6,
            null, "Cierre aprobado")).thenReturn(1);

        var verifiedResult = service.transition(9L,
            new IncidentStatusRequest("VERIFICADO", "Servicio estable", 5), "admin@gtel.test");
        var closedResult = service.transition(9L,
            new IncidentStatusRequest("CERRADO", "Cierre aprobado", 6), "admin@gtel.test");

        assertEquals("VERIFICADO", verifiedResult.incident().status());
        assertEquals("CERRADO", closedResult.incident().status());
        verify(repository).addHistory(9L, 1L, "admin@gtel.test", "SERVICIO_RECUPERADO",
            "VERIFICADO", "Servicio estable");
        verify(repository).addHistory(9L, 1L, "admin@gtel.test", "VERIFICADO",
            "CERRADO", "Cierre aprobado");
    }

    @Test
    void administratorLinksTicketAndRfcWithAuditWithoutChangingTheirStates() {
        WorkflowActor admin = new WorkflowActor(1L, "ADMIN");
        IncidentResponse incident = incident("EN_INVESTIGACION", "P2", 3, 22L);
        when(identity.actor("admin@gtel.test")).thenReturn(admin);
        when(repository.find(9L)).thenReturn(incident);
        when(repository.ticketExists(12L)).thenReturn(true);
        when(repository.changeExists(4L)).thenReturn(true);
        when(repository.linkTicket(9L, 12L, "AFECTADO", 1L)).thenReturn(1);
        when(repository.linkChange(9L, 4L, "CORRECCION", 1L)).thenReturn(1);
        when(repository.ticketIds(9L)).thenReturn(List.of(12L));
        when(repository.changeIds(9L)).thenReturn(List.of(4L));

        var ticketResult = service.linkTicket(9L, 12L,
            new IncidentTicketLinkRequest("AFECTADO"), "admin@gtel.test");
        var changeResult = service.linkChange(9L, 4L,
            new IncidentChangeLinkRequest("CORRECCION"), "admin@gtel.test");

        assertEquals(List.of(12L), ticketResult.ticketIds());
        assertEquals(List.of(4L), changeResult.changeRequestIds());
        verify(identity).audit(admin, "incidentes_produccion", 9L, "actualizar", "Ticket vinculado: 12");
        verify(identity).audit(admin, "incidentes_produccion", 9L, "actualizar", "RFC vinculada: 4");
    }

    @Test
    void recruiterReadsOnlyRepositorySummaryBoundToOwnTickets() {
        WorkflowActor recruiter = new WorkflowActor(15L, "RECLUTADOR");
        List<IncidentLinkedSummary> summaries = List.of(
            new IncidentLinkedSummary(9L, "INC-2026-00009", "Caída", "API", "P2", "EN_INVESTIGACION"));
        when(identity.actor("recruiter@gtel.test")).thenReturn(recruiter);
        when(repository.listLinkedForRequester(15L)).thenReturn(summaries);

        assertEquals(summaries, service.linkedToRequester("recruiter@gtel.test"));
        verify(repository).listLinkedForRequester(15L);
    }

    @Test
    void recruiterReadsOnlyIncidentsReportedByAuthenticatedIdentity() {
        WorkflowActor recruiter = new WorkflowActor(15L, "RECLUTADOR");
        List<IncidentResponse> incidents = List.of(incident("REGISTRADO", null, 0, null));
        when(identity.actor("recruiter@gtel.test")).thenReturn(recruiter);
        when(repository.listForReporter(15L)).thenReturn(incidents);

        assertEquals(incidents, service.reportedByRequester("recruiter@gtel.test"));
        verify(repository).listForReporter(15L);
    }

    @Test
    void operationalRolesCannotUseRecruiterReportedByMeProjection() {
        when(identity.actor("admin@gtel.test")).thenReturn(new WorkflowActor(1L, "ADMIN"));

        assertEquals(HttpStatus.FORBIDDEN, assertThrows(ResponseStatusException.class,
            () -> service.reportedByRequester("admin@gtel.test")).getStatusCode());
        verify(repository, never()).listForReporter(1L);
    }

    private IncidentCreateRequest request(String scope, String impact, String urgency,
                                          boolean essential, boolean workaround, boolean blocked) {
        return new IncidentCreateRequest("Caída del servicio", "API", "INC_PLATAFORMA_CAIDA", "AVAILABILITY",
            "Error general", scope, impact, urgency, essential, workaround, blocked, false, null,
            LocalDateTime.of(2026, 11, 19, 10, 0), LocalDateTime.of(2026, 11, 19, 9, 55), false, null,
            "INC_PLATAFORMA_CAIDA", "MANUAL", null);
    }

    private IncidentResponse incident(String status, String priority, int version, Long responsibleId) {
        return incident(status, priority, version, responsibleId, null, false);
    }

    private IncidentResponse incident(String status, String priority, int version, Long responsibleId,
                                      String solution, boolean activeEscalation) {
        LocalDateTime now = LocalDateTime.of(2026, 11, 19, 10, 0);
        return new IncidentResponse(9L, "INC-2026-00009", "Caída del servicio", "API", "DISPONIBILIDAD",
            "MANUAL", "AVAILABILITY", CATEGORY, priority == null ? null : CATEGORY, "",
            "Error general", "GENERAL", "CRITICO", "INMEDIATA", true, false, true, "P1",
            priority, status, status, activeEscalation, 1L, "admin@gtel.test", responsibleId,
            responsibleId == null ? null : "tech@gtel.test",
            responsibleId == null ? "PENDIENTE" : "AUTOMATICA", responsibleId == null ? null : 7L,
            responsibleId == null ? null : now, null, null, now, now.minusMinutes(5), null, null, null, null,
            solution, null, null, false, null, now.plusMinutes(15), now.plusMinutes(240), version, now, now);
    }
}
