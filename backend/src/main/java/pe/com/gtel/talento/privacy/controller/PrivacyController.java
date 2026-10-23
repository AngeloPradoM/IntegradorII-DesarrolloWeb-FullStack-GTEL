package pe.com.gtel.talento.privacy.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import pe.com.gtel.talento.privacy.dto.AnonymizeRequest;
import pe.com.gtel.talento.privacy.dto.AnonymizeResponse;
import pe.com.gtel.talento.privacy.dto.DataExportResponse;
import pe.com.gtel.talento.privacy.service.PrivacyArcoService;

@RestController
@RequestMapping("/api/candidate/privacy")
@Tag(name = "9. Privacidad y Derechos ARCO (Ley 29733)", description = "Gestión de derechos de Acceso, Rectificación, Cancelación y Oposición de datos personales según la normativa peruana.")
public class PrivacyController {

    private final PrivacyArcoService privacyArcoService;

    public PrivacyController(PrivacyArcoService privacyArcoService) {
        this.privacyArcoService = privacyArcoService;
    }

    @GetMapping("/policy")
    @Operation(summary = "Consultar política de privacidad", description = "Devuelve los términos de tratamiento de datos personales, finalidades y plazos de retención.")
    public ResponseEntity<Map<String, Object>> getPrivacyPolicyInfo() {
        return ResponseEntity.ok(Map.of(
                "ley", "Ley N° 29733 de Protección de Datos Personales (Perú)",
                "reglamento", "Decreto Supremo N° 003-2013-JUS",
                "titularBanco", "GTEL TALENTO S.A.C.",
                "finalidad", "Gestión integral de selección de personal, evaluaciones técnicas y convocatorias de empleo.",
                "derechosArco", "Acceso, Rectificación, Cancelación y Oposición",
                "tiempoRetencionMeses", 24,
                "version", "v1.0-ley29733"
        ));
    }

    @GetMapping("/export")
    @Operation(summary = "Exportar datos personales (Derecho de Acceso y Portabilidad)", description = "Genera un volcado completo de toda la información personal y postulaciones del titular.")
    public ResponseEntity<DataExportResponse> exportMyData(Authentication authentication, HttpServletRequest request) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Debes iniciar sesión para acceder a tus datos.");
        }

        String ip = extractClientIp(request);
        String userAgent = request.getHeader("User-Agent");

        DataExportResponse response = privacyArcoService.exportCandidateData(authentication.getName(), ip, userAgent);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/anonymize")
    @Operation(summary = "Solicitar anonimización / baja (Derecho de Cancelación)", description = "Elimina de forma irreversible los datos identificables y el archivo de CV, manteniendo únicamente auditoría disociada.")
    public ResponseEntity<AnonymizeResponse> anonymizeMyAccount(
            @Valid @RequestBody AnonymizeRequest body,
            Authentication authentication,
            HttpServletRequest request) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Debes iniciar sesión para solicitar la anonimización.");
        }

        String ip = extractClientIp(request);
        String userAgent = request.getHeader("User-Agent");

        AnonymizeResponse response = privacyArcoService.anonymizeCandidateAccount(
                authentication.getName(),
                body,
                ip,
                userAgent
        );
        return ResponseEntity.ok(response);
    }

    private String extractClientIp(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
