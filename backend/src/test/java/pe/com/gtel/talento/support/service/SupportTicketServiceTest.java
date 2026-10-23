package pe.com.gtel.talento.support.service;

import java.time.LocalDateTime;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.regex.Pattern;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;
import pe.com.gtel.talento.identity.dto.WorkflowActor;
import pe.com.gtel.talento.identity.service.WorkflowIdentity;
import pe.com.gtel.talento.notification.service.NotificationService;
import pe.com.gtel.talento.support.dto.SupportTicketResponse;
import pe.com.gtel.talento.support.dto.TicketDecisionRequest;
import pe.com.gtel.talento.support.dto.TicketExecutionRequest;
import pe.com.gtel.talento.support.dto.TicketStatusRequest;
import pe.com.gtel.talento.support.repository.SupportTicketRepository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SupportTicketServiceTest {

    @Mock private SupportTicketRepository repository;
    @Mock private WorkflowIdentity identity;
    @Mock private NotificationService notifications;
    @InjectMocks private SupportTicketService service;

    @Test
    void migrationStoresAValidBcryptHashForTechnicianAccount() throws Exception {
        String sql = Files.readString(Path.of("database/migrations/007_support_tickets.sql"));
        var matcher = Pattern.compile("\\$2[aby]\\$\\d{2}\\$[./A-Za-z0-9]{53}").matcher(sql);
        assertTrue(matcher.find());
        assertTrue(new BCryptPasswordEncoder().matches("Tecnico2026!", matcher.group()));
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
            8L, "SR-000008", "Error al confirmar postulación", "Postulaciones", "No puedo postular",
            "ALTA", "El sistema rechaza el formulario.", "Bloquea el proceso de selección.", "Reclutamiento",
            status, 15L, "reclutador1@gmail.com", technicianId,
            technicianId == null ? null : "tecnico1@gmail.com", "Diagnóstico", "Solución propuesta",
            proposalStatus, null, status.equals("RESUELTO") ? "Evidencia" : null, now, now,
            status.equals("RESUELTO") ? now : null);
    }
}
