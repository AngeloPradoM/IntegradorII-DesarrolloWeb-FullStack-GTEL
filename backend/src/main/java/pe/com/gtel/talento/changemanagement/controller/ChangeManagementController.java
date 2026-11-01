package pe.com.gtel.talento.changemanagement.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import pe.com.gtel.talento.changemanagement.dto.ChangeAssignmentRequest;
import pe.com.gtel.talento.changemanagement.dto.ChangeCreateRequest;
import pe.com.gtel.talento.changemanagement.dto.ChangeDecisionRequest;
import pe.com.gtel.talento.changemanagement.dto.ChangeDocumentPayload;
import pe.com.gtel.talento.changemanagement.dto.ChangeExecutionRequest;
import pe.com.gtel.talento.changemanagement.dto.ChangeResponse;
import pe.com.gtel.talento.changemanagement.dto.ChangeTechnicalReviewRequest;
import pe.com.gtel.talento.changemanagement.dto.ChangeValidationRequest;
import pe.com.gtel.talento.changemanagement.service.ChangeManagementService;

@RestController
@RequestMapping("/api/change-management")
public class ChangeManagementController {
    private static final MediaType DOCX = MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    private final ChangeManagementService service;
    public ChangeManagementController(ChangeManagementService service) { this.service = service; }

    @GetMapping("/requests")
    public List<ChangeResponse> list(Principal principal) { return service.list(principal.getName()); }

    @PostMapping(value = "/requests", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ChangeResponse create(@Valid @RequestPart("data") ChangeCreateRequest request,
                                 @RequestPart("document") MultipartFile document, Principal principal) {
        return service.create(request, document, principal.getName());
    }

    @PatchMapping("/requests/{id}/assignment")
    public ChangeResponse assign(@PathVariable long id, @Valid @org.springframework.web.bind.annotation.RequestBody ChangeAssignmentRequest request, Principal principal) {
        return service.assign(id, request, principal.getName());
    }

    @PutMapping("/requests/{id}/technical-review")
    public ChangeResponse review(@PathVariable long id, @Valid @org.springframework.web.bind.annotation.RequestBody ChangeTechnicalReviewRequest request, Principal principal) {
        return service.review(id, request, principal.getName());
    }

    @PatchMapping("/requests/{id}/decision")
    public ChangeResponse decide(@PathVariable long id, @Valid @org.springframework.web.bind.annotation.RequestBody ChangeDecisionRequest request, Principal principal) {
        return service.decide(id, request, principal.getName());
    }

    @PutMapping("/requests/{id}/execution")
    public ChangeResponse execute(@PathVariable long id, @Valid @org.springframework.web.bind.annotation.RequestBody ChangeExecutionRequest request, Principal principal) {
        return service.execute(id, request, principal.getName());
    }

    @PatchMapping("/requests/{id}/validation")
    public ChangeResponse validate(@PathVariable long id, @Valid @org.springframework.web.bind.annotation.RequestBody ChangeValidationRequest request, Principal principal) {
        return service.validate(id, request, principal.getName());
    }

    @GetMapping("/requests/{id}/document")
    public ResponseEntity<Resource> document(@PathVariable long id, Principal principal) {
        ChangeDocumentPayload document = service.document(id, principal.getName());
        return download(new ByteArrayResource(document.content()), document.name(), MediaType.parseMediaType(document.mimeType()));
    }

    @GetMapping("/template")
    public ResponseEntity<Resource> template(Principal principal) throws java.io.IOException {
        service.authorizeTemplateDownload(principal.getName());
        ClassPathResource resource = new ClassPathResource("templates/Formato_RFC.docx");
        return download(resource, "Formato_RFC.docx", DOCX);
    }

    private ResponseEntity<Resource> download(Resource resource, String filename, MediaType type) {
        return ResponseEntity.ok()
            .contentType(type)
            .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(filename).build().toString())
            .body(resource);
    }
}
