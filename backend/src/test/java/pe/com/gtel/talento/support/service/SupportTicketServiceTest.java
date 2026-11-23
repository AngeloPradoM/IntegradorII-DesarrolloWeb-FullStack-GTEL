package pe.com.gtel.talento.support.service;

import java.time.LocalDateTime;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.regex.Pattern;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import pe.com.gtel.talento.identity.dto.WorkflowActor;
import pe.com.gtel.talento.identity.service.WorkflowIdentity;
import pe.com.gtel.talento.notification.service.NotificationService;
import pe.com.gtel.talento.support.dto.SupportTicketResponse;
import pe.com.gtel.talento.support.dto.TicketDecisionRequest;
import pe.com.gtel.talento.support.dto.TicketExecutionRequest;
import pe.com.gtel.talento.support.dto.TicketStatusRequest;
import pe.com.gtel.talento.support.dto.TicketCreateRequest;
import pe.com.gtel.talento.support.repository.SupportTicketRepository;
import pe.com.gtel.talento.support.repository.SupportCatalogRepository;
import pe.com.gtel.talento.incident.repository.IncidentConfigurationRepository;
import pe.com.gtel.talento.incident.repository.IncidentConfigurationRepository.CategoryConfiguration;
import pe.com.gtel.talento.incident.repository.IncidentConfigurationRepository.ProblemTypeConfiguration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;

@ExtendWith(MockitoExtension.class)
class SupportTicketServiceTest {

    @Mock private SupportTicketRepository repository;
    @Mock private SupportCatalogRepository catalogs;
    @Mock private IncidentConfigurationRepository incidentCatalogs;
    @Mock private WorkflowIdentity identity;
    @Mock private NotificationService notifications;
    @InjectMocks private SupportTicketService service;

    @Test
    void rejectsInactiveStructuredRequestTypeBeforePersistence() {
        when(identity.actor("reclutador1@gmail.com")).thenReturn(new WorkflowActor(15L,"RECLUTADOR"));
        TicketCreateRequest request=new TicketCreateRequest("Ayuda con CV","CV","Carga","SOLICITUD",
            "MEDIA","Necesito orientación para cargar el documento.","Impacto individual.",
            "SOL_INACTIVA",null,"WEB","UN_USUARIO","BAJO","MEDIA",false,"PRIMERA_VEZ");

        ResponseStatusException error=assertThrows(ResponseStatusException.class,
            () -> service.create(request,"reclutador1@gmail.com"));

        assertEquals(HttpStatus.BAD_REQUEST,error.getStatusCode());
        verify(catalogs).findActive("SOL_INACTIVA");
        verifyNoInteractions(notifications);
    }

    @Test
    void structuredRequestUsesServerPriorityAndCatalogLabels() {
        when(identity.actor("reclutador1@gmail.com")).thenReturn(new WorkflowActor(15L,"RECLUTADOR"));
        when(catalogs.findActive("SOL_PUBLICAR_OFERTA")).thenReturn(
            new SupportCatalogRepository.RequestType("SOL_PUBLICAR_OFERTA","Ayuda con ofertas",
                "Asistencia para publicar una oferta.","JOBS",60));
        TicketCreateRequest request=new TicketCreateRequest("Necesito publicar","Manipulada","Manipulada",
            "SOLICITUD","BAJA","Necesito orientación para publicar una oferta.",
            "Prioridad manipulada por cliente.","SOL_PUBLICAR_OFERTA",null,"WEB",
            "VARIOS_USUARIOS","BAJO","BAJA",false,"PRIMERA_VEZ");
        when(repository.reserveCreation(eq(15L),eq("request-00000001"),anyString())).thenReturn(true);
        when(repository.create(15L,request,"ALTA","JOBS","Ayuda con ofertas",
            "Clasificación automática del servidor. Código: SOL_PUBLICAR_OFERTA. Alcance: VARIOS_USUARIOS. Impacto: BAJO. Urgencia: BAJA. Continuidad: DISPONIBLE. Frecuencia: PRIMERA_VEZ. Prioridad: ALTA."))
            .thenReturn(8L);
        when(repository.find(8L)).thenReturn(ticket(null,"SIN_PROPUESTA","NUEVO"));

        service.create(request,"reclutador1@gmail.com","request-00000001");

        verify(repository).create(eq(15L),eq(request),eq("ALTA"),eq("JOBS"),eq("Ayuda con ofertas"),
            contains("Prioridad: ALTA."));
        verify(repository).completeCreation(15L,"request-00000001",8L);
    }

    @Test
    void incidentReportUsesServerProblemCategoryAndTicketPriorityWithoutCreatingIncident() {
        when(identity.actor("reclutador1@gmail.com")).thenReturn(new WorkflowActor(15L,"RECLUTADOR"));
        when(incidentCatalogs.problemTypeByCode("INC_PLATAFORMA_CAIDA")).thenReturn(
            new ProblemTypeConfiguration("INC_PLATAFORMA_CAIDA","DISPONIBILIDAD_PLATAFORMA",
                "Página inaccesible","Interrupción total o parcial",10));
        when(incidentCatalogs.categoryByCode("DISPONIBILIDAD_PLATAFORMA")).thenReturn(
            new CategoryConfiguration("DISPONIBILIDAD_PLATAFORMA","Disponibilidad","AVAILABILITY"));
        TicketCreateRequest request=new TicketCreateRequest("No puedo ingresar","Manipulada","Manipulada",
            "INCIDENTE","BAJA","La plataforma no responde desde el navegador.",
            "Prioridad manipulada por cliente.",null,"INC_PLATAFORMA_CAIDA","WEB",
            "SERVICIO_GENERAL","ALTO","ALTA",true,"RECURRENTE");
        when(repository.reserveCreation(eq(15L),eq("incident-00000001"),anyString())).thenReturn(true);
        when(repository.create(eq(15L),eq(request),eq("ALTA"),eq("AVAILABILITY"),
            eq("Página inaccesible"),contains("La prioridad P1-P4 corresponde únicamente"))).thenReturn(8L);
        when(repository.find(8L)).thenReturn(ticket(null,"SIN_PROPUESTA","NUEVO"));

        service.create(request,"reclutador1@gmail.com","incident-00000001");

        verify(repository).create(eq(15L),eq(request),eq("ALTA"),eq("AVAILABILITY"),
            eq("Página inaccesible"),contains("Código: INC_PLATAFORMA_CAIDA"));
        verify(repository).completeCreation(15L,"incident-00000001",8L);
    }

    @Test
    void repeatedIdempotencyKeyReturnsExistingTicketWithoutCreatingAnother() {
        when(identity.actor("reclutador1@gmail.com")).thenReturn(new WorkflowActor(15L,"RECLUTADOR"));
        when(catalogs.findActive("SOL_PUBLICAR_OFERTA")).thenReturn(
            new SupportCatalogRepository.RequestType("SOL_PUBLICAR_OFERTA","Ayuda con ofertas",
                "Asistencia para publicar una oferta.","JOBS",60));
        TicketCreateRequest request=new TicketCreateRequest("Necesito publicar","JOBS","Ayuda con ofertas",
            "SOLICITUD","ALTA","Necesito orientación para publicar una oferta.",
            "Clasificación preliminar.","SOL_PUBLICAR_OFERTA",null,"WEB",
            "VARIOS_USUARIOS","BAJO","BAJA",false,"PRIMERA_VEZ");
        AtomicReference<String> hash=new AtomicReference<>();
        when(repository.reserveCreation(eq(15L),eq("request-00000002"),anyString())).thenAnswer(call->{
            hash.set(call.getArgument(2)); return false;
        });
        when(repository.findCreation(15L,"request-00000002")).thenAnswer(call->
            new SupportTicketRepository.IdempotencyRecord(hash.get(),8L));
        when(repository.find(8L)).thenReturn(ticket(null,"SIN_PROPUESTA","NUEVO"));

        SupportTicketResponse response=service.create(
            request,"reclutador1@gmail.com","request-00000002");

        assertEquals("SR-000008",response.code());
        verify(repository,never()).create(eq(15L),eq(request),anyString(),anyString(),anyString(),anyString());
        verifyNoInteractions(notifications);
    }

    @Test
    void migrationStoresABcryptHashForTechnicianAccount() throws Exception {
        String sql = Files.readString(Path.of("../database/migrations/008_support_tickets.sql"));
        var matcher = Pattern.compile("\\$2[aby]\\$\\d{2}\\$[./A-Za-z0-9]{53}").matcher(sql);
        assertTrue(matcher.find());
        assertEquals(60, matcher.group().length());
    }

    @Test
    void technicianCannotStartExecutionBeforeAdminApproval() {
        WorkflowActor technician = new WorkflowActor(22L, "TECNICO");
        when(identity.actor("tecnico1@gmail.com")).thenReturn(technician);
        when(repository.find(8L)).thenReturn(ticket(22L, "PENDIENTE", "ASIGNADO"));

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
            () -> service.updateStatus(8L, new TicketStatusRequest("EN_ATENCION"), "tecnico1@gmail.com"));

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        verifyNoInteractions(notifications);
    }

    @Test
    void technicianCanConsultItsSlaDashboard() {
        WorkflowActor technician = new WorkflowActor(22L, "TECNICO");
        when(identity.actor("tecnico1@gmail.com")).thenReturn(technician);
        when(repository.getDashboardBoard(22L)).thenReturn(java.util.List.of());

        assertTrue(service.getTechnicianDashboard("tecnico1@gmail.com").isEmpty());
        verify(repository).getDashboardBoard(22L);
    }

    @Test
    void adminCannotApproveProposalWithoutAssignedTechnician() {
        when(identity.actor("Administrador@gmail.com")).thenReturn(new WorkflowActor(1L, "ADMIN"));
        when(repository.find(8L)).thenReturn(ticket(null, "PENDIENTE", "EN_ESPERA"));

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
            () -> service.decide(8L, new TicketDecisionRequest(true, "Autorizado"), "Administrador@gmail.com"));

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
    }

    @Test
    void assignedTechnicianCanResolveAfterAdminApproval() {
        WorkflowActor technician = new WorkflowActor(22L, "TECNICO");
        SupportTicketResponse approved = ticket(22L, "APROBADA", "ASIGNADO");
        SupportTicketResponse resolved = ticket(22L, "APROBADA", "RESUELTO");
        when(identity.actor("tecnico1@gmail.com")).thenReturn(technician);
        when(repository.find(8L)).thenReturn(approved, resolved);

        SupportTicketResponse result = service.execute(
            8L, new TicketExecutionRequest("Captura y registro de validación adjuntos."), "tecnico1@gmail.com");

        assertEquals("RESUELTO", result.status());
        verify(repository).saveExecution(8L, "Captura y registro de validación adjuntos.");
        verify(repository).addHistory(8L, 22L, "ASIGNADO", "RESUELTO", "Ejecución registrada con evidencia");
        verify(identity).audit(technician, "tickets_soporte", 8L, "actualizar", "Ticket resuelto por soporte técnico");
        verify(notifications).notifyUser(15L, "Ticket resuelto", "El ticket SR-000008 fue resuelto por soporte técnico.", "SOPORTE_TICKET", "/reclutador/tickets");
    }

    private SupportTicketResponse ticket(Long technicianId, String proposalStatus, String status) {
        LocalDateTime now = LocalDateTime.of(2026, 10, 22, 17, 0);
        return new SupportTicketResponse(
            8L, "SR-000008", "Error al confirmar postulación", "Postulaciones", "No puedo postular", "INCIDENTE",
            "ALTA", "El sistema rechaza el formulario.", "Bloquea el proceso de selección.", "Reclutamiento",
            null, null, "WEB", 1L, now.plusHours(4), now.plusHours(24), null,
            status, 15L, "reclutador1@gmail.com", technicianId,
            technicianId == null ? null : "tecnico1@gmail.com", "Diagnóstico", "Solución propuesta",
            proposalStatus, null, status.equals("RESUELTO") ? "Evidencia" : null, now, now,
            status.equals("RESUELTO") ? now : null);
    }
}
