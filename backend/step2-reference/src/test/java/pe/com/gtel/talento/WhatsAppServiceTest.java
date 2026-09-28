package pe.com.gtel.talento;

import static org.junit.jupiter.api.Assertions.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicInteger;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.client.MockClientHttpResponse;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;
import pe.com.gtel.talento.service.WhatsAppService;

class WhatsAppServiceTest {
    @Test void sendsConfiguredAuthenticationTemplateToActualCandidate() {
        var calls = new AtomicInteger();
        var builder = RestClient.builder().requestInterceptor((request, body, execution) -> {
            calls.incrementAndGet();
            assertEquals("https://graph.facebook.com/v23.0/123456/messages", request.getURI().toString());
            assertEquals("Bearer test-only-token", request.getHeaders().getFirst("Authorization"));
            var json = new ObjectMapper().readTree(body);
            assertEquals("51987654321", json.get("to").asText());
            var template = json.get("template");
            assertEquals("approved_test_template", template.get("name").asText());
            assertEquals("es_MX", template.get("language").get("code").asText());
            var components = template.get("components");
            assertEquals("123456", components.get(0).get("parameters").get(0).get("text").asText());
            assertEquals("url", components.get(1).get("sub_type").asText());
            assertEquals("123456", components.get(1).get("parameters").get(0).get("text").asText());
            return new MockClientHttpResponse("{}".getBytes(StandardCharsets.UTF_8), HttpStatus.OK);
        });
        var service = new WhatsAppService("test-only-token", "123456", "v23.0",
                "https://graph.facebook.com", "approved_test_template", "es_MX", builder);
        service.sendCode("+51987654321", "123456");
        assertEquals(1, calls.get());
    }

    @Test void providerErrorDoesNotExposeSensitiveResponse() {
        var builder = RestClient.builder().requestInterceptor((request, body, execution) ->
                new MockClientHttpResponse("secret-provider-response".getBytes(StandardCharsets.UTF_8), HttpStatus.BAD_REQUEST));
        var service = new WhatsAppService("test-only-token", "123456", "v23.0",
                "https://graph.facebook.com", "approved_test_template", "es_MX", builder);
        var error = assertThrows(ResponseStatusException.class, () -> service.sendCode("+51987654321", "123456"));
        assertEquals(502, error.getStatusCode().value());
        assertFalse(error.toString().contains("secret-provider-response"));
        assertNull(error.getCause());
    }

    @Test void missingConfigurationFailsWithoutNetworkCall() {
        var service = new WhatsAppService("", "", "v23.0", "https://graph.facebook.com", "", "", RestClient.builder());
        var error = assertThrows(ResponseStatusException.class, () -> service.sendCode("+51987654321", "123456"));
        assertEquals(503, error.getStatusCode().value());
    }
}
