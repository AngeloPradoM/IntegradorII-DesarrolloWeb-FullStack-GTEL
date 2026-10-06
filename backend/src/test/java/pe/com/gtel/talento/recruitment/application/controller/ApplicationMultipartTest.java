package pe.com.gtel.talento.recruitment.application.controller;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import pe.com.gtel.talento.recruitment.application.controller.*;
import pe.com.gtel.talento.recruitment.application.service.ApplicationService;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
class ApplicationMultipartTest {
    @Test void acceptsBrowserMultipartAndExplainsInvalidFields() throws Exception {
        var service=mock(ApplicationService.class);
        when(service.apply(eq(1L),any(),eq(true),any(),eq("qa@example.test"))).thenReturn(Map.of("id",1));
        var mvc=MockMvcBuilders.standaloneSetup(new ApplicationController(service)).setControllerAdvice(new ApplicationErrors()).build();
        String payload="""
          {"nombres":"Ana","apellidos":"Prueba","dni":"12345678","telefono":"+51987654321","distrito":"Lima","motivacion":"Interés","email":"qa@example.test","fechaNacimiento":"2000-01-01"}
          """;
        var cv=new MockMultipartFile("cv","cv.pdf","application/pdf","%PDF-1.4\n%%EOF".getBytes(StandardCharsets.UTF_8));
        mvc.perform(multipart("/api/candidate/applications/1").file(cv)
          .file(new MockMultipartFile("data","blob","application/json",payload.getBytes(StandardCharsets.UTF_8)))
          .param("terms","true").principal(()->"qa@example.test")).andExpect(status().isCreated());
        mvc.perform(multipart("/api/candidate/applications/1").file(cv)
          .file(new MockMultipartFile("data","blob","application/json",payload.replace("12345678","123").getBytes(StandardCharsets.UTF_8)))
          .param("terms","true").principal(()->"qa@example.test")).andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.errors.dni").value("Ingresa un DNI de 8 dígitos."));
        verify(service,times(1)).apply(eq(1L),any(),eq(true),any(),eq("qa@example.test"));
    }
}
