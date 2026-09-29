package pe.com.gtel.talento.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import pe.com.gtel.talento.security.JwtAuthenticationFilter;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SecurityConfigTest {
    @Test void configuredOriginsAreTrimmedAndUnknownOriginsRejected() {
        var config = new SecurityConfig(mock(JwtAuthenticationFilter.class));
        var source = config.corsConfigurationSource("http://localhost:5173, https://team.example.test , ");
        var cors = source.getCorsConfiguration(new MockHttpServletRequest("OPTIONS", "/api/auth/login"));
        assertNotNull(cors);
        assertEquals("https://team.example.test", cors.checkOrigin("https://team.example.test"));
        assertNull(cors.checkOrigin("https://unknown.example.test"));
        assertTrue(cors.getAllowedHeaders().contains("Authorization"));
        assertTrue(cors.getAllowedMethods().contains("POST"));
    }
}
