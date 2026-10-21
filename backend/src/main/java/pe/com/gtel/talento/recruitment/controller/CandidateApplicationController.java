package pe.com.gtel.talento.recruitment.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import pe.com.gtel.talento.recruitment.dto.ApplicationResponse;
import pe.com.gtel.talento.recruitment.dto.ApplicationSubmitRequest;
import pe.com.gtel.talento.recruitment.service.CandidateApplicationService;
import pe.com.gtel.talento.recruitment.service.CvStorageService;

@RestController
@RequestMapping("/api/candidate")
@Tag(name = "3. Portal del Candidato", description = "Endpoints para registro de postulaciones con CV, consulta de estado personal y descarga de documentos.")
public class CandidateApplicationController {

    private final CandidateApplicationService service;
    private final CvStorageService cvStorageService;
    private final ObjectMapper objectMapper;

    public CandidateApplicationController(
            CandidateApplicationService service,
            CvStorageService cvStorageService,
            ObjectMapper objectMapper) {
        this.service = service;
        this.cvStorageService = cvStorageService;
        this.objectMapper = objectMapper;
    }

    @PostMapping(value = "/applications", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Enviar postulación con CV adjunto", description = "Registra una nueva postulación vinculada a una vacante activa, validando el archivo PDF y actualizando el perfil del candidato.")
    public ApplicationResponse submitApplication(
            @RequestPart(value = "cv", required = false) MultipartFile cvFile,
            @RequestPart(value = "file", required = false) MultipartFile fileFallback,
            @RequestPart(value = "application", required = false) String applicationJson,
            @RequestParam(value = "jobId", required = false) Long jobIdParam,
            @RequestParam(value = "nombres", required = false) String nombresParam,
            @RequestParam(value = "apellidos", required = false) String apellidosParam,
            @RequestParam(value = "dni", required = false) String dniParam,
            @RequestParam(value = "telefono", required = false) String telefonoParam,
            @RequestParam(value = "distrito", required = false) String distritoParam,
            @RequestParam(value = "motivacion", required = false) String motivacionParam,
            @RequestParam(value = "termsAccepted", required = false) Boolean termsParam,
            Authentication authentication) {

        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Debes iniciar sesión para postular.");
        }

        MultipartFile actualCv = cvFile != null ? cvFile : fileFallback;
        if (actualCv == null || actualCv.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debes adjuntar tu archivo de currículum (CV).");
        }

        ApplicationSubmitRequest request = new ApplicationSubmitRequest();

        // 1. Extraer desde el JSON si vino
        if (applicationJson != null && !applicationJson.isBlank()) {
            try {
                request = objectMapper.readValue(applicationJson, ApplicationSubmitRequest.class);
            } catch (Exception e) {
                try {
                    com.fasterxml.jackson.databind.JsonNode root = objectMapper.readTree(applicationJson);
                    if (root.has("jobId")) request.setJobId(root.get("jobId").asLong());
                    if (root.has("termsAccepted")) request.setTermsAccepted(root.get("termsAccepted").asBoolean());
                    if (root.has("personalData")) {
                        com.fasterxml.jackson.databind.JsonNode pd = root.get("personalData");
                        if (pd.has("nombres")) request.setNombres(pd.get("nombres").asText());
                        if (pd.has("apellidos")) request.setApellidos(pd.get("apellidos").asText());
                        if (pd.has("dni")) request.setDni(pd.get("dni").asText());
                        if (pd.has("telefono")) request.setTelefono(pd.get("telefono").asText());
                        if (pd.has("distrito")) request.setDistrito(pd.get("distrito").asText());
                        if (pd.has("motivacion")) request.setMotivacion(pd.get("motivacion").asText());
                    }
                } catch (Exception ignored) {}
            }
        }

        // 2. Parámetros directos sobreescriben si no estaban en el JSON
        if (jobIdParam != null) request.setJobId(jobIdParam);
        if (nombresParam != null && !nombresParam.isBlank()) request.setNombres(nombresParam);
        if (apellidosParam != null && !apellidosParam.isBlank()) request.setApellidos(apellidosParam);
        if (dniParam != null && !dniParam.isBlank()) request.setDni(dniParam);
        if (telefonoParam != null && !telefonoParam.isBlank()) request.setTelefono(telefonoParam);
        if (distritoParam != null && !distritoParam.isBlank()) request.setDistrito(distritoParam);
        if (motivacionParam != null && !motivacionParam.isBlank()) request.setMotivacion(motivacionParam);
        if (termsParam != null) request.setTermsAccepted(termsParam);

        return service.submitApplication(request.getJobId(), request, actualCv, authentication.getName());
    }

    @GetMapping("/applications")
    @Operation(summary = "Listar postulaciones del candidato", description = "Devuelve el historial de todas las vacantes a las que ha postulado el candidato autenticado con su estado y fecha.")
    public List<ApplicationResponse> getMyApplications(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Inicia sesión como candidato.");
        }
        return service.getCandidateApplications(authentication.getName());
    }

    @GetMapping("/applications/{id}")
    @Operation(summary = "Obtener detalle de postulación", description = "Devuelve información detallada de una postulación específica del candidato.")
    public ApplicationResponse getMyApplication(@PathVariable Long id, Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Inicia sesión como candidato.");
        }
        return service.getCandidateApplication(id, authentication.getName());
    }

    @GetMapping("/cv/{filename:.+}")
    @Operation(summary = "Descargar archivo CV", description = "Permite la descarga segura del currículum verificando la propiedad del archivo o privilegios de reclutador.")
    public ResponseEntity<Resource> downloadCv(@PathVariable String filename, Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Debes iniciar sesión para descargar documentos.");
        }

        boolean isStaff = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_RECLUTADOR") || a.getAuthority().equals("ROLE_ADMIN")
                        || a.getAuthority().equals("ROLE_JEFATURA_SOLICITANTE") || a.getAuthority().equals("ROLE_ANALISTA_RRHH")
                        || a.getAuthority().equals("ROLE_ENTREVISTADOR"));

        Resource resource = service.loadCvFile(filename, authentication.getName(), isStaff);

        String ext = filename.contains(".") ? filename.substring(filename.lastIndexOf('.') + 1) : "pdf";
        String contentType = cvStorageService.determineContentType(ext);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .body(resource);
    }
}
