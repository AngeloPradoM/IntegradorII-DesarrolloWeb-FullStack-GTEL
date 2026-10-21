package pe.com.gtel.talento.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    public static final String SECURITY_SCHEME_NAME = "Bearer Authentication";

    @Bean
    public OpenAPI gtelTalentoOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("GTEL Talento ATS - API REST Oficial")
                        .description("Especificación técnica oficial y documentación interactiva de endpoints para la plataforma de reclutamiento GTEL Talento ATS. "
                                + "Soporta autenticación JWT con OTP, gestión de postulaciones, flujo de selección, entrevistas, evaluaciones, auditoría y papelera.")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Equipo de Desarrollo GTEL Talento")
                                .email("soporte@gtel.com.pe")
                                .url("https://gtel.com.pe"))
                        .license(new License()
                                .name("Uso Académico e Institucional - Integrador II GTEL")
                                .url("https://gtel.com.pe/licencia")))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME, new SecurityScheme()
                                .name(SECURITY_SCHEME_NAME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Ingresa el token JWT generado en /api/auth/login para autorizar las solicitudes protegidas.")));
    }
}
