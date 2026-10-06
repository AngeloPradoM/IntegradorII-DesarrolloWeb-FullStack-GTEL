package pe.com.gtel.talento.shared.api;

import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.com.gtel.talento.admin.controller.AdminErrors;
import pe.com.gtel.talento.admin.controller.AdminUserController;
import pe.com.gtel.talento.admin.service.AdminUserService;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ApiExceptionHandlerTest {
    @RestController
    static class FailingController {
        @GetMapping("/test/database")
        String database() {
            throw new DataAccessResourceFailureException("Private JDBC details and credentials");
        }

        @GetMapping("/test/conflict")
        String conflict() {
            throw new DataIntegrityViolationException("Private SQL and personal data");
        }
    }

    @Test void persistenceFailuresUseSafeJsonAndAppropriateStatus() throws Exception {
        var mvc = MockMvcBuilders.standaloneSetup(new FailingController())
            .setControllerAdvice(new ApiExceptionHandler()).build();
        mvc.perform(get("/test/database")).andExpect(status().isServiceUnavailable())
            .andExpect(content().json("""
                {"detail":"El servicio de datos no está disponible. Inténtalo nuevamente."}
                """, true));
        mvc.perform(get("/test/conflict")).andExpect(status().isConflict())
            .andExpect(jsonPath("$.detail").value("No se pudo completar la operación: los datos entran en conflicto con un registro existente."))
            .andExpect(jsonPath("$.errors").doesNotExist());
    }

    @Test void adminKeepsItsExistingConflictMessage() throws Exception {
        var service = mock(AdminUserService.class);
        when(service.list(anyString(), anyInt())).thenThrow(new DataIntegrityViolationException("Private SQL"));
        var mvc = MockMvcBuilders.standaloneSetup(new AdminUserController(service))
            .setControllerAdvice(new ApiExceptionHandler(), new AdminErrors()).build();
        mvc.perform(get("/api/admin/users")).andExpect(status().isConflict())
            .andExpect(content().json("""
                {"detail":"No se pudo guardar: correo duplicado o datos relacionados incompatibles."}
                """, true));
    }
}
