package pe.com.gtel.talento.incident.controller;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import java.security.Principal;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;

import pe.com.gtel.talento.incident.dto.IncidentReportFilter;
import pe.com.gtel.talento.incident.service.IncidentReportingService;
import pe.com.gtel.talento.incident.service.IncidentReportingService.ExportedWorkbook;
import pe.com.gtel.talento.incident.service.ProductionIncidentService;

@ExtendWith(MockitoExtension.class)
class ProductionIncidentControllerTest {
    @Mock private ProductionIncidentService incidents;
    @Mock private IncidentReportingService reporting;
    @InjectMocks private ProductionIncidentController controller;

    @Test
    void exportUsesSafeAttachmentHeadersAndDisablesCaching() {
        IncidentReportFilter filter = new IncidentReportFilter(null, "ESCALADO", "P1", null, null, null, null);
        Principal principal = () -> "admin@gtel.test";
        byte[] content = { 'P', 'K', 1, 2 };
        when(reporting.export(filter, principal.getName()))
            .thenReturn(new ExportedWorkbook(content, "incidentes-produccion-2026-11-19.xlsx"));

        var response = controller.export(filter, principal);

        assertEquals("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            response.getHeaders().getContentType().toString());
        assertTrue(response.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION).startsWith("attachment;"));
        assertEquals("no-store", response.getHeaders().getCacheControl());
        assertArrayEquals(content, response.getBody());
    }
}
