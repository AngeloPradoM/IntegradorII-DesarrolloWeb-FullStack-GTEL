package pe.com.gtel.talento.service;

import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

@Service
public class WhatsAppService {
    private final RestClient client;
    private final String phoneNumberId, version, template, language;
    private final boolean configured;

    public WhatsAppService(
            @Value("${whatsapp.access-token}") String token,
            @Value("${whatsapp.phone-number-id}") String phoneNumberId,
            @Value("${whatsapp.api-version}") String version,
            @Value("${whatsapp.graph-api-url}") String baseUrl,
            @Value("${whatsapp.template-name}") String template,
            @Value("${whatsapp.template-language}") String language,
            RestClient.Builder builder) {
        this.phoneNumberId = phoneNumberId; this.version = version;
        this.template = template; this.language = language;
        this.configured = !token.isBlank() && phoneNumberId.matches("[0-9]+")
                && version.matches("v[0-9]+\\.[0-9]+") && !template.isBlank() && !language.isBlank();
        if (!"https://graph.facebook.com".equals(baseUrl))
            throw new IllegalArgumentException("WhatsApp requiere el endpoint HTTPS de Graph API");
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(10000);
        this.client = builder.baseUrl(baseUrl).requestFactory(factory)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + token).build();
    }
    public void sendCode(String phone, String code) {
        if (!configured) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "WhatsApp no está configurado");
        if (phone == null || !phone.matches("\\+[1-9][0-9]{7,14}") || code == null || !code.matches("[0-9]{6}"))
            throw new IllegalArgumentException("Datos de entrega inválidos");
        var parameters = List.of(Map.of("type", "text", "text", code));
        var body = Map.of("messaging_product", "whatsapp", "to", phone.substring(1), "type", "template",
                "template", Map.of("name", template, "language", Map.of("code", language), "components", List.of(
                        Map.of("type", "body", "parameters", parameters),
                        Map.of("type", "button", "sub_type", "url", "index", "0", "parameters", parameters))));
        try {
            client.post().uri("/{version}/{id}/messages", version, phoneNumberId)
                    .contentType(MediaType.APPLICATION_JSON).body(body).retrieve().toBodilessEntity();
        } catch (RestClientException ex) {
            // Never propagate Meta's response/request: it may contain sensitive values.
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "No se pudo enviar el código por WhatsApp; inicia sesión nuevamente");
        }
    }
}
