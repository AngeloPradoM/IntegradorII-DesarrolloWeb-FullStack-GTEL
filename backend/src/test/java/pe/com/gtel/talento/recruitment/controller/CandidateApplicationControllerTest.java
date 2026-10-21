package pe.com.gtel.talento.recruitment.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import pe.com.gtel.talento.recruitment.dto.ApplicationResponse;
import pe.com.gtel.talento.recruitment.dto.TimelineStepResponse;
import pe.com.gtel.talento.recruitment.service.CandidateApplicationService;
import pe.com.gtel.talento.recruitment.service.CvStorageService;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class CandidateApplicationControllerTest {

    final CandidateApplicationService service = mock(CandidateApplicationService.class);
    final CvStorageService cvStorageService = mock(CvStorageService.class);
    final ObjectMapper objectMapper = new ObjectMapper();
    final CandidateApplicationController controller = new CandidateApplicationController(service, cvStorageService, objectMapper);

    @Test
    void submitApplicationParsesMultipartAndReturnsCreated() {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                "postulante1@gmail.com", "pass", List.of(new SimpleGrantedAuthority("ROLE_CANDIDATO")));

        byte[] pdfBytes = new byte[]{0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34};
        MockMultipartFile file = new MockMultipartFile("cv", "cv.pdf", "application/pdf", pdfBytes);

        ApplicationResponse mockResp = new ApplicationResponse(
                1L, "GTEL-2026-1234", "GTEL-2026-1234", "1", 5L,
                "Asesor Comercial", "GTEL Telecomunicaciones", "Lima, Perú", "Ventas",
                "recibida", "08 Oct 2026", "08 Oct 2026", "2026-10-08T12:00:00",
                new ApplicationResponse.CvInfo("cv.pdf", "/api/candidate/cv/cv.pdf"),
                List.of(new TimelineStepResponse("Postulación enviada", "08 Oct 2026", true, true, false, "Recibida"))
        );

        when(service.submitApplication(eq(5L), any(), eq(file), eq("postulante1@gmail.com")))
                .thenReturn(mockResp);

        String jsonApp = "{\"jobId\":5,\"termsAccepted\":true,\"personalData\":{\"nombres\":\"Juan\",\"apellidos\":\"Pérez\"}}";

        ApplicationResponse res = controller.submitApplication(
                file, null, jsonApp, null, null, null, null, null, null, null, null, auth);

        assertNotNull(res);
        assertEquals("GTEL-2026-1234", res.code());
        assertEquals("recibida", res.status());
        verify(service, times(1)).submitApplication(eq(5L), any(), eq(file), eq("postulante1@gmail.com"));
    }

    @Test
    void getMyApplicationsReturnsList() {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                "postulante1@gmail.com", "pass", List.of(new SimpleGrantedAuthority("ROLE_CANDIDATO")));

        ApplicationResponse mockResp = new ApplicationResponse(
                1L, "GTEL-2026-1234", "GTEL-2026-1234", "1", 5L,
                "Asesor Comercial", "GTEL Telecomunicaciones", "Lima, Perú", "Ventas",
                "recibida", "08 Oct 2026", "08 Oct 2026", "2026-10-08T12:00:00",
                new ApplicationResponse.CvInfo("cv.pdf", "/api/candidate/cv/cv.pdf"),
                List.of()
        );

        when(service.getCandidateApplications("postulante1@gmail.com")).thenReturn(List.of(mockResp));

        List<ApplicationResponse> list = controller.getMyApplications(auth);
        assertNotNull(list);
        assertEquals(1, list.size());
        assertEquals("GTEL-2026-1234", list.get(0).code());
    }
}
