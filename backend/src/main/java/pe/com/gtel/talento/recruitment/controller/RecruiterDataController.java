package pe.com.gtel.talento.recruitment.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.Map;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pe.com.gtel.talento.recruitment.dto.CandidateStatusUpdateRequest;
import pe.com.gtel.talento.recruitment.dto.EvaluationRequest;
import pe.com.gtel.talento.recruitment.dto.EvaluationResponse;
import pe.com.gtel.talento.recruitment.dto.InterviewRequest;
import pe.com.gtel.talento.recruitment.dto.InterviewResponse;
import pe.com.gtel.talento.recruitment.dto.VacanteRequest;
import pe.com.gtel.talento.recruitment.dto.VacanteResponse;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import pe.com.gtel.talento.recruitment.service.CandidateApplicationService;
import pe.com.gtel.talento.recruitment.dto.RequerimientoRequest;
import pe.com.gtel.talento.recruitment.dto.RequerimientoResponse;
import pe.com.gtel.talento.recruitment.dto.RequerimientoStatusRequest;
import pe.com.gtel.talento.recruitment.service.CvStorageService;
import pe.com.gtel.talento.recruitment.service.EvaluationService;
import pe.com.gtel.talento.recruitment.service.InterviewService;
import pe.com.gtel.talento.recruitment.service.RecruiterDataService;
import pe.com.gtel.talento.recruitment.service.RequerimientoService;
import pe.com.gtel.talento.recruitment.service.VacanteService;

@RestController
@RequestMapping("/api/recruiter")
@Tag(name = "4. Panel del Reclutador y Selección", description = "Gestión de candidatos, postulaciones, agenda de entrevistas, evaluaciones técnicas y métricas ATS.")
public class RecruiterDataController {

    private final RecruiterDataService service;
    private final VacanteService vacanteService;
    private final CandidateApplicationService candidateApplicationService;
    private final CvStorageService cvStorageService;
    private final InterviewService interviewService;
    private final EvaluationService evaluationService;
    private final RequerimientoService requerimientoService;
    private final pe.com.gtel.talento.notification.service.NotificationService notificationService;

    public RecruiterDataController(
            RecruiterDataService service,
            VacanteService vacanteService,
            CandidateApplicationService candidateApplicationService,
            CvStorageService cvStorageService,
            InterviewService interviewService,
            EvaluationService evaluationService,
            RequerimientoService requerimientoService,
            pe.com.gtel.talento.notification.service.NotificationService notificationService) {
        this.service = service;
        this.vacanteService = vacanteService;
        this.candidateApplicationService = candidateApplicationService;
        this.cvStorageService = cvStorageService;
        this.interviewService = interviewService;
        this.evaluationService = evaluationService;
        this.requerimientoService = requerimientoService;
        this.notificationService = notificationService;
    }

    @GetMapping("/candidates")
    @Operation(summary = "Listar candidatos (Tablero Kanban)", description = "Devuelve los candidatos agregados por postulación reciente para el tablero Kanban.")
    public List<Map<String, Object>> candidates() {
        return service.candidates();
    }

    @GetMapping("/applications")
    @Operation(summary = "Listar postulaciones y CVs", description = "Devuelve todas las postulaciones con historial de fases (steps), datos académicos y CV.")
    public List<Map<String, Object>> applications() {
        return service.applications();
    }

    @GetMapping({"/interviews", "/selection/interviews"})
    @Operation(summary = "Listar entrevistas programadas", description = "Devuelve la agenda de entrevistas con fechas, horas, modalidad y entrevistador.")
    public List<InterviewResponse> interviews() {
        return interviewService.getRecruiterInterviews();
    }

    @PostMapping({"/interviews", "/selection/interviews"})
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Agendar entrevista", description = "Programa una entrevista técnica o por competencias, promoviendo al candidato a fase 'entrevista'.")
    public InterviewResponse scheduleInterview(
            @Valid @RequestBody InterviewRequest request,
            Authentication authentication) {
        return interviewService.scheduleInterview(request, authentication.getName());
    }

    @PutMapping({"/interviews/{id}", "/selection/interviews/{id}"})
    @Operation(summary = "Reprogramar o actualizar entrevista", description = "Permite cambiar fecha, hora, duración, modalidad o estado de una entrevista.")
    public InterviewResponse updateInterview(
            @PathVariable Long id,
            @RequestBody InterviewRequest request,
            Authentication authentication) {
        return interviewService.updateInterview(id, request, authentication.getName());
    }

    @GetMapping({"/evaluations", "/selection/evaluations"})
    @Operation(summary = "Listar evaluaciones registradas", description = "Devuelve las pruebas técnicas y psicolaborales con sus puntajes y criterios.")
    public List<EvaluationResponse> evaluations() {
        return evaluationService.getRecruiterEvaluations();
    }

    @PostMapping({"/evaluations", "/selection/evaluations"})
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Registrar evaluación técnica", description = "Guarda la calificación de criterios y actualiza el score ATS general de la postulación.")
    public EvaluationResponse createEvaluation(
            @Valid @RequestBody EvaluationRequest request,
            Authentication authentication) {
        return evaluationService.createEvaluation(request, authentication.getName());
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Métricas y KPIs del Dashboard", description = "Devuelve indicadores ATS: embudo de conversión, postulaciones por área, alertas y candidatos destacados.")
    public Map<String, Object> dashboard() {
        return service.dashboard();
    }

    @GetMapping("/jobs")
    @Operation(summary = "Listar vacantes del reclutador", description = "Devuelve las ofertas gestionadas por el equipo de reclutamiento con filtros de estado.")
    public List<VacanteResponse> jobs(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {
        return vacanteService.listRecruiterJobs(search, status);
    }

    @GetMapping("/jobs/{id}")
    @Operation(summary = "Obtener vacante por id", description = "Devuelve la información detallada de una oferta para su edición.")
    public VacanteResponse getJob(@PathVariable Long id) {
        return vacanteService.getRecruiterJob(id);
    }

    @PostMapping("/jobs")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Crear nueva vacante", description = "Publica una nueva oferta laboral vinculada a un departamento técnico.")
    public VacanteResponse createJob(@Valid @RequestBody VacanteRequest request, Authentication authentication) {
        return vacanteService.createJob(request, authentication.getName());
    }

    @PutMapping("/jobs/{id}")
    @Operation(summary = "Actualizar vacante", description = "Modifica los requisitos, salario, vacantes o descripción de una oferta.")
    public VacanteResponse updateJob(
            @PathVariable Long id,
            @Valid @RequestBody VacanteRequest request,
            Authentication authentication) {
        return vacanteService.updateJob(id, request, authentication.getName());
    }

    @PatchMapping("/jobs/{id}/status")
    @Operation(summary = "Cambiar estado de vacante", description = "Cambia el estado de una vacante a 'activa', 'pausada' o 'cerrada'.")
    public VacanteResponse updateJobStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        return vacanteService.changeJobStatus(id, body.get("status"), authentication.getName());
    }

    @GetMapping("/departments")
    @Operation(summary = "Listar departamentos", description = "Catálogo de áreas organizacionales.")
    public List<Map<String, Object>> departments() {
        return vacanteService.listDepartments();
    }

    @GetMapping("/cv/{filename:.+}")
    @Operation(summary = "Descargar CV", description = "Descarga el archivo físico de currículum.")
    public ResponseEntity<Resource> downloadCandidateCv(@PathVariable String filename, Authentication authentication) {
        Resource resource = candidateApplicationService.loadCvFile(filename, authentication.getName(), true);
        String ext = filename.contains(".") ? filename.substring(filename.lastIndexOf('.') + 1) : "pdf";
        String contentType = cvStorageService.determineContentType(ext);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .body(resource);
    }

    @RequestMapping(
            value = {"/candidates/{id}/status", "/applications/{id}/status"},
            method = {RequestMethod.PATCH, RequestMethod.PUT}
    )
    @Operation(summary = "Actualizar estado de postulación", description = "Mueve al candidato entre etapas (recibida -> en_revision -> entrevista -> aprobada/rechazada) registrando auditoría en timeline.")
    public Map<String, Object> updateCandidateStatus(
            @PathVariable Long id,
            @RequestBody CandidateStatusUpdateRequest request,
            Authentication authentication) {
        String comment = request != null ? request.getComment() : null;
        String status = request != null ? request.getStatus() : null;
        return candidateApplicationService.updateCandidateStatus(id, status, comment, authentication.getName());
    }

    @GetMapping({"/candidates/{id}/timeline", "/applications/{id}/timeline"})
    @Operation(summary = "Obtener timeline de la postulación", description = "Devuelve el registro cronológico de cambios de estado y comentarios.")
    public List<Map<String, Object>> getCandidateTimeline(@PathVariable Long id) {
        return candidateApplicationService.getCandidateTimeline(id);
    }

    @GetMapping("/requirements")
    @Operation(summary = "Listar requerimientos de personal", description = "Devuelve las solicitudes de vacantes enviadas por jefaturas.")
    public List<RequerimientoResponse> getRequirements(Authentication authentication) {
        String role = extractRole(authentication);
        return requerimientoService.listar(authentication.getName(), role);
    }

    @PostMapping("/requirements")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Crear requerimiento de personal", description = "Permite a una jefatura solicitar la apertura de una nueva vacante.")
    public RequerimientoResponse createRequirement(
            @Valid @RequestBody RequerimientoRequest request,
            Authentication authentication) {
        return requerimientoService.crear(request, authentication.getName());
    }

    @PatchMapping("/requirements/{id}/status")
    @Operation(summary = "Aprobar o rechazar requerimiento", description = "Permite a RRHH o Administración aprobar o rechazar una solicitud de personal.")
    public RequerimientoResponse updateRequirementStatus(
            @PathVariable Long id,
            @Valid @RequestBody RequerimientoStatusRequest request,
            Authentication authentication) {
        String role = extractRole(authentication);
        return requerimientoService.cambiarEstado(id, request, authentication.getName(), role);
    }

    @GetMapping("/notifications")
    @Operation(summary = "Obtener notificaciones", description = "Devuelve las notificaciones activas del usuario autenticado.")
    public List<pe.com.gtel.talento.notification.dto.NotificacionResponse> getNotifications(Authentication authentication) {
        return notificationService.getNotificationsForUser(authentication.getName());
    }

    private String extractRole(Authentication authentication) {
        if (authentication == null || authentication.getAuthorities() == null) return "RECLUTADOR";
        return authentication.getAuthorities().stream()
                .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                .findFirst()
                .map(a -> a.startsWith("ROLE_") ? a.substring(5) : a)
                .orElse("RECLUTADOR");
    }
}
