package pe.com.gtel.talento.recruitment.controller;

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
    public List<Map<String, Object>> candidates() {
        return service.candidates();
    }

    @GetMapping("/interviews")
    public List<InterviewResponse> interviews() {
        return interviewService.getRecruiterInterviews();
    }

    @PostMapping("/interviews")
    @ResponseStatus(HttpStatus.CREATED)
    public InterviewResponse scheduleInterview(
            @Valid @RequestBody InterviewRequest request,
            Authentication authentication) {
        return interviewService.scheduleInterview(request, authentication.getName());
    }

    @GetMapping("/evaluations")
    public List<EvaluationResponse> evaluations() {
        return evaluationService.getRecruiterEvaluations();
    }

    @PostMapping("/evaluations")
    @ResponseStatus(HttpStatus.CREATED)
    public EvaluationResponse createEvaluation(
            @Valid @RequestBody EvaluationRequest request,
            Authentication authentication) {
        return evaluationService.createEvaluation(request, authentication.getName());
    }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() {
        return service.dashboard();
    }

    @GetMapping("/jobs")
    public List<VacanteResponse> jobs(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {
        return vacanteService.listRecruiterJobs(search, status);
    }

    @GetMapping("/jobs/{id}")
    public VacanteResponse getJob(@PathVariable Long id) {
        return vacanteService.getRecruiterJob(id);
    }

    @PostMapping("/jobs")
    @ResponseStatus(HttpStatus.CREATED)
    public VacanteResponse createJob(@Valid @RequestBody VacanteRequest request, Authentication authentication) {
        return vacanteService.createJob(request, authentication.getName());
    }

    @PutMapping("/jobs/{id}")
    public VacanteResponse updateJob(
            @PathVariable Long id,
            @Valid @RequestBody VacanteRequest request,
            Authentication authentication) {
        return vacanteService.updateJob(id, request, authentication.getName());
    }

    @PatchMapping("/jobs/{id}/status")
    public VacanteResponse updateJobStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        return vacanteService.changeJobStatus(id, body.get("status"), authentication.getName());
    }

    @GetMapping("/departments")
    public List<Map<String, Object>> departments() {
        return vacanteService.listDepartments();
    }

    @GetMapping("/cv/{filename:.+}")
    public ResponseEntity<Resource> downloadCandidateCv(@PathVariable String filename, Authentication authentication) {
        Resource resource = candidateApplicationService.loadCvFile(filename, authentication.getName(), true);
        String ext = filename.contains(".") ? filename.substring(filename.lastIndexOf('.') + 1) : "pdf";
        String contentType = cvStorageService.determineContentType(ext);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .body(resource);
    }

    @PatchMapping("/candidates/{id}/status")
    public Map<String, Object> updateCandidateStatus(
            @PathVariable Long id,
            @RequestBody CandidateStatusUpdateRequest request,
            Authentication authentication) {
        String comment = request != null ? request.getComment() : null;
        String status = request != null ? request.getStatus() : null;
        return candidateApplicationService.updateCandidateStatus(id, status, comment, authentication.getName());
    }

    @GetMapping("/candidates/{id}/timeline")
    public List<Map<String, Object>> getCandidateTimeline(@PathVariable Long id) {
        return candidateApplicationService.getCandidateTimeline(id);
    }

    @GetMapping("/requirements")
    public List<RequerimientoResponse> getRequirements(Authentication authentication) {
        String role = extractRole(authentication);
        return requerimientoService.listar(authentication.getName(), role);
    }

    @PostMapping("/requirements")
    @ResponseStatus(HttpStatus.CREATED)
    public RequerimientoResponse createRequirement(
            @Valid @RequestBody RequerimientoRequest request,
            Authentication authentication) {
        return requerimientoService.crear(request, authentication.getName());
    }

    @PatchMapping("/requirements/{id}/status")
    public RequerimientoResponse updateRequirementStatus(
            @PathVariable Long id,
            @Valid @RequestBody RequerimientoStatusRequest request,
            Authentication authentication) {
        String role = extractRole(authentication);
        return requerimientoService.cambiarEstado(id, request, authentication.getName(), role);
    }

    @GetMapping("/notifications")
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
