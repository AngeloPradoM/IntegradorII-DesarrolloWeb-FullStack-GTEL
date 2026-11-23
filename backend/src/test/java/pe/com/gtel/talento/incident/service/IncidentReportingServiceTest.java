package pe.com.gtel.talento.incident.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
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
import pe.com.gtel.talento.incident.dto.IncidentReportFilter;
import pe.com.gtel.talento.incident.dto.IncidentControlResponse;
import pe.com.gtel.talento.incident.dto.IncidentResponse;
import pe.com.gtel.talento.incident.repository.ProductionIncidentRepository;

@ExtendWith(MockitoExtension.class)
class IncidentReportingServiceTest {
    @Mock private ProductionIncidentRepository repository;
    @Mock private WorkflowIdentity identity;
    @Mock private IncidentWorkbookExporter workbook;
    private IncidentReportingService service;

    @BeforeEach
    void setUp() {
        service = new IncidentReportingService(repository, new IncidentPermissionPolicy(), identity, workbook);
    }

    @Test
    void calculatesRealTotalsAveragesOverdueAndBreakdowns() {
        LocalDateTime now = LocalDateTime.of(2026, 11, 19, 12, 0);
        var response = service.calculate(List.of(
            incident(1, "P1", "ACCESO_AUTENTICACION", "EN_INVESTIGACION", "EN_DIAGNOSTICO",
                now.minusHours(4), now.minusHours(3), null, now.minusHours(1), true),
            incident(2, "P2", "DATOS_MYSQL", "CERRADO", "CERRADO",
                now.minusHours(5), now.minusHours(3), now.minusHours(2), now.plusHours(1), false)
        ), now);

        assertEquals(2, response.total());
        assertEquals(1, response.open());
        assertEquals(1, response.closed());
        assertEquals(1.5, response.averageAttentionHours());
        assertEquals(3.0, response.averageResolutionHours());
        assertEquals(1, response.overdue());
        assertEquals(1, response.repeatedFailures());
        assertEquals(List.of("P1", "P2"), response.byPriority().stream().map(value -> value.key()).toList());
        assertEquals(List.of("EN_DIAGNOSTICO", "CERRADO"), response.byStatus().stream().map(value -> value.key()).toList());
    }

    @Test
    void technicianIndicatorsAndExportUseOnlyVisibleRowsAndActiveFilters() {
        WorkflowActor technician = new WorkflowActor(22L, "TECNICO");
        List<IncidentResponse> visible = List.of(
            incident(1, "P1", "ACCESO_AUTENTICACION", "EN_INVESTIGACION", "EN_DIAGNOSTICO",
                LocalDateTime.now().minusHours(2), LocalDateTime.now().minusHours(1), null,
                LocalDateTime.now().plusHours(2), false),
            incident(2, "P3", "DATOS_MYSQL", "ASIGNADO", "NUEVO",
                LocalDateTime.now().minusHours(1), null, null, LocalDateTime.now().plusHours(8), false));
        when(identity.actor("tech@gtel.test")).thenReturn(technician);
        when(repository.listForTechnician(22L)).thenReturn(visible);
        when(workbook.export(any(), any(), any(), any())).thenReturn(new byte[] { 1, 2, 3 });
        IncidentReportFilter filter = new IncidentReportFilter("INC-1", "EN_DIAGNOSTICO", "P1",
            "ACCESO_AUTENTICACION", 22L, LocalDate.now().minusDays(1), LocalDate.now());

        var indicators = service.indicators(filter, "tech@gtel.test");
        var exported = service.export(filter, "tech@gtel.test");

        assertEquals(1, indicators.total());
        assertEquals(3, exported.content().length);
        verify(repository, org.mockito.Mockito.times(2)).listForTechnician(22L);
        verify(workbook).export(org.mockito.ArgumentMatchers.argThat(rows -> rows.size() == 1 && rows.get(0).id() == 1L), any(), eq(filter), any());
        verify(identity).audit(technician, "incidentes_produccion", 0L, "actualizar",
            "ExportaciÃ³n XLSX de incidentes: 1 registros");
    }

    @Test
    void recruiterCannotReadOperationalIndicatorsOrExport() {
        when(identity.actor("recruiter@gtel.test")).thenReturn(new WorkflowActor(15L, "RECLUTADOR"));

        var error = assertThrows(ResponseStatusException.class, () -> service.indicators(
            new IncidentReportFilter(null, null, null, null, null, null, null), "recruiter@gtel.test"));
        var controlError = assertThrows(ResponseStatusException.class,
            () -> service.control("recruiter@gtel.test"));

        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
        assertEquals(HttpStatus.FORBIDDEN, controlError.getStatusCode());
        verifyNoInteractions(repository, workbook);
    }

    @Test
    void consolidatedControlUsesRoleScopedViewQueries() {
        WorkflowActor admin = new WorkflowActor(1L, "ADMIN");
        WorkflowActor technician = new WorkflowActor(22L, "TECNICO");
        IncidentControlResponse row = new IncidentControlResponse(9L, "INC-2026-00009", LocalDateTime.now(),
            "recruiter@gtel.test", "Falla", "Disponibilidad", "P1", "tech@gtel.test", "REGISTRADO",
            null, null, null, null, false, null, null, 4.0, false, "WEB", null, 22L, "tech@gtel.test");
        when(identity.actor("admin@gtel.test")).thenReturn(admin);
        when(identity.actor("tech@gtel.test")).thenReturn(technician);
        when(repository.listControlAll()).thenReturn(List.of(row));
        when(repository.listControlForTechnician(22L)).thenReturn(List.of(row));

        assertEquals(List.of(row), service.control("admin@gtel.test"));
        assertEquals(List.of(row), service.control("tech@gtel.test"));
        verify(repository).listControlAll();
        verify(repository).listControlForTechnician(22L);
    }

    private IncidentResponse incident(long id, String priority, String category, String status,
                                      String displayStatus, LocalDateTime detected, LocalDateTime attended,
                                      LocalDateTime recovered, LocalDateTime resolutionDeadline, boolean repeated) {
        return new IncidentResponse(id, "INC-" + id, "Incidente " + id, "API", "CAIDA", "MANUAL",
            "WEB", null, "AVAILABILITY", category, category, "", "Descripción", "GENERAL", "ALTO", "ALTA",
            true, false, true, priority, priority, status, displayStatus, false,
            1L, "admin@gtel.test", 1L, "admin@gtel.test", 22L, "tech@gtel.test", "AUTOMATICA", 7L, detected,
            null, null, detected, detected, attended, recovered, recovered, "CERRADO".equals(status) ? recovered : null,
            recovered == null ? null : "Reinicio", "Bloqueo", "Alerta", repeated, null,
            detected.plusMinutes(30), resolutionDeadline, 3, detected, detected);
    }
}
