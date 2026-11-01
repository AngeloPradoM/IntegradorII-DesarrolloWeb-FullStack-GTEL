package pe.com.gtel.talento.changemanagement.service;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;
import java.util.Set;
import java.util.zip.ZipInputStream;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import pe.com.gtel.talento.changemanagement.dto.ChangeAssignmentRequest;
import pe.com.gtel.talento.changemanagement.dto.ChangeCreateRequest;
import pe.com.gtel.talento.changemanagement.dto.ChangeDecisionRequest;
import pe.com.gtel.talento.changemanagement.dto.ChangeDocumentPayload;
import pe.com.gtel.talento.changemanagement.dto.ChangeExecutionRequest;
import pe.com.gtel.talento.changemanagement.dto.ChangeResponse;
import pe.com.gtel.talento.changemanagement.dto.ChangeTechnicalReviewRequest;
import pe.com.gtel.talento.changemanagement.dto.ChangeValidationRequest;
import pe.com.gtel.talento.changemanagement.repository.ChangeManagementRepository;
import pe.com.gtel.talento.identity.dto.WorkflowActor;
import pe.com.gtel.talento.identity.service.WorkflowIdentity;
import pe.com.gtel.talento.notification.service.NotificationService;

@Service
@Transactional
public class ChangeManagementService {
    private static final long MAX_DOCUMENT_SIZE = 10L * 1024 * 1024;
    private static final String DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    private static final String DOCX_MAIN_CONTENT_TYPE =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml";
    private static final Set<String> REVIEWABLE = Set.of("ASIGNADO", "AJUSTES_SOLICITADOS");
    private static final Set<String> EXECUTABLE = Set.of("APROBADO", "OBSERVADO");

    private final ChangeManagementRepository repository;
    private final WorkflowIdentity identity;
    private final NotificationService notifications;

    public ChangeManagementService(ChangeManagementRepository repository, WorkflowIdentity identity,
                                   NotificationService notifications) {
        this.repository = repository;
        this.identity = identity;
        this.notifications = notifications;
    }

    @Transactional(readOnly = true)
    public List<ChangeResponse> list(String email) {
        WorkflowActor actor = identity.actor(email);
        return switch (actor.role()) {
            case "ADMIN" -> repository.listAll();
            case "RECLUTADOR" -> repository.listForRequester(actor.id());
            case "TECNICO" -> repository.listForTechnician(actor.id());
            default -> throw forbidden();
        };
    }

    public ChangeResponse create(ChangeCreateRequest request, MultipartFile document, String email) {
        WorkflowActor actor = identity.actor(email);
        requireRole(actor, "RECLUTADOR");
        byte[] content = validateDocx(document);
        long id = repository.create(actor.id(), request);
        repository.saveDocument(id, actor.id(), safeName(document.getOriginalFilename()), DOCX_MIME,
            content, sha256(content));
        ChangeResponse created = requireChange(id);
        repository.addHistory(id, actor.id(), null, "REGISTRADO", "RFC registrada con documento adjunto");
        identity.audit(actor, "solicitudes_cambio", id, "crear", "Solicitud de cambio " + created.code());
        notifyRoles(List.of("TECNICO"), "Nueva gestión de cambio",
            created.code() + " requiere evaluación técnica: " + created.title(), "/tecnico/tickets");
        notifyRoles(List.of("ADMIN"), "Nueva gestión de cambio",
            created.code() + " fue registrada y requiere seguimiento.", "/admin/tickets");
        return created;
    }

    public ChangeResponse assign(long id, ChangeAssignmentRequest request, String email) {
        WorkflowActor actor = identity.actor(email);
        requireRole(actor, "ADMIN");
        ChangeResponse change = requireChange(id);
        if (!repository.isActiveTechnician(request.technicianId())) throw bad("Selecciona un técnico activo.");
        if (actor.id() == request.technicianId()) throw bad("La autoridad de cambio no puede asignarse como implementador.");
        repository.assign(id, request.technicianId());
        repository.addHistory(id, actor.id(), change.status(), "ASIGNADO", "Responsable e implementador asignados");
        identity.audit(actor, "solicitudes_cambio", id, "actualizar", "Implementador asignado");
        notifyUser(request.technicianId(), "Gestión de cambio asignada",
            "Se te asignó " + change.code() + ". Revisa el RFC y completa la evaluación técnica.", "/tecnico/tickets");
        return requireChange(id);
    }

    public ChangeResponse review(long id, ChangeTechnicalReviewRequest request, String email) {
        WorkflowActor actor = identity.actor(email);
        requireRole(actor, "TECNICO");
        ChangeResponse change = requireAssigned(id, actor);
        if (!REVIEWABLE.contains(change.status())) throw conflict("La RFC no está disponible para evaluación técnica.");
        repository.saveTechnicalReview(id, request);
        repository.addHistory(id, actor.id(), change.status(), "PENDIENTE_APROBACION",
            change.type().equals("ESTANDAR") ? "Cambio estándar enviado para validación administrativa" : "Evaluación enviada a la autoridad de cambios");
        identity.audit(actor, "solicitudes_cambio", id, "actualizar", "Evaluación técnica registrada");
        notifyRoles(List.of("ADMIN"), "RFC pendiente de aprobación",
            change.code() + " tiene evaluación técnica completa.", "/admin/tickets");
        return requireChange(id);
    }

    public ChangeResponse decide(long id, ChangeDecisionRequest request, String email) {
        WorkflowActor actor = identity.actor(email);
        requireRole(actor, "ADMIN");
        ChangeResponse change = requireChange(id);
        if (!"PENDIENTE_APROBACION".equals(change.status())) throw conflict("La RFC no está pendiente de aprobación.");
        if (actor.id() == change.requesterId() || actor.id() == nullable(change.responsibleId()) || actor.id() == nullable(change.implementerId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Nadie puede aprobar su propio cambio.");
        }
        String comment = text(request.comment());
        String members = text(request.cabMembers());
        if (!request.approved() && comment.isBlank()) throw bad("Indica los ajustes requeridos.");
        if ("NORMAL".equals(change.type()) && request.approved() && members.isBlank()) {
            throw bad("Registra los participantes del CAB para aprobar un cambio normal.");
        }
        String level = riskLevel(request.riskProbability(), request.riskImpact());
        repository.decide(id, actor.id(), request.approved(), request.riskProbability(), request.riskImpact(),
            level, comment, members);
        String next = request.approved() ? "APROBADO" : "AJUSTES_SOLICITADOS";
        repository.addHistory(id, actor.id(), change.status(), next,
            request.approved() ? "Ejecución autorizada por la autoridad de cambios" : "RFC devuelta para ajustes");
        identity.audit(actor, "solicitudes_cambio", id, "actualizar", request.approved() ? "RFC aprobada" : "RFC observada");
        notifyUser(change.implementerId(), request.approved() ? "Cambio autorizado" : "RFC con ajustes",
            request.approved() ? "Puedes ejecutar " + change.code() + " según el plan aprobado."
                : "Corrige " + change.code() + ": " + comment, "/tecnico/tickets");
        return requireChange(id);
    }

    public ChangeResponse execute(long id, ChangeExecutionRequest request, String email) {
        WorkflowActor actor = identity.actor(email);
        requireRole(actor, "TECNICO");
        ChangeResponse change = requireAssigned(id, actor);
        if (!EXECUTABLE.contains(change.status())) throw conflict("La ejecución todavía no fue autorizada.");
        repository.execute(id, request);
        repository.addHistory(id, actor.id(), change.status(), "EN_VALIDACION", "Ejecución registrada; pendiente de validación del solicitante");
        identity.audit(actor, "solicitudes_cambio", id, "actualizar", "Resultado de ejecución: " + request.result());
        notifyUser(change.requesterId(), "Cambio pendiente de validación",
            "Valida el resultado de " + change.code() + ".", "/reclutador/tickets");
        return requireChange(id);
    }

    public ChangeResponse validate(long id, ChangeValidationRequest request, String email) {
        WorkflowActor actor = identity.actor(email);
        requireRole(actor, "RECLUTADOR");
        ChangeResponse change = requireChange(id);
        if (change.requesterId() != actor.id()) throw forbidden();
        if (!"EN_VALIDACION".equals(change.status())) throw conflict("La RFC no está pendiente de validación.");
        String comment = text(request.comment());
        if (!request.accepted() && comment.isBlank()) throw bad("Indica qué debe corregirse.");
        repository.validate(id, request.accepted(), comment);
        String next = request.accepted() ? "CERRADO" : "OBSERVADO";
        repository.addHistory(id, actor.id(), change.status(), next,
            request.accepted() ? "Resultado validado por el solicitante" : "Resultado observado por el solicitante");
        identity.audit(actor, "solicitudes_cambio", id, "actualizar", request.accepted() ? "RFC cerrada" : "Ejecución observada");
        notifyUser(change.implementerId(), request.accepted() ? "RFC cerrada" : "Resultado observado",
            request.accepted() ? change.code() + " fue validada y cerrada." : change.code() + " requiere corrección: " + comment,
            "/tecnico/tickets");
        return requireChange(id);
    }

    public ChangeDocumentPayload document(long id, String email) {
        WorkflowActor actor = identity.actor(email);
        ChangeResponse change = requireChange(id);
        boolean allowed = actor.role().equals("ADMIN")
            || actor.role().equals("RECLUTADOR") && change.requesterId() == actor.id()
            || actor.role().equals("TECNICO") && (actor.id() == nullable(change.responsibleId()) || actor.id() == nullable(change.implementerId()));
        if (!allowed) throw forbidden();
        ChangeDocumentPayload document = repository.document(id);
        if (document == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Documento RFC no encontrado.");
        identity.audit(actor, "solicitudes_cambio", id, "actualizar", "Documento RFC descargado");
        return document;
    }

    @Transactional(readOnly = true)
    public void authorizeTemplateDownload(String email) {
        WorkflowActor actor = identity.actor(email);
        if (!Set.of("RECLUTADOR", "ADMIN").contains(actor.role())) throw forbidden();
    }

    private byte[] validateDocx(MultipartFile document) {
        try {
            if (document == null || document.isEmpty()) throw bad("Adjunta el RFC completado en formato DOCX.");
            if (document.getSize() > MAX_DOCUMENT_SIZE) throw bad("El RFC no puede superar 10 MB.");
            String name = safeName(document.getOriginalFilename());
            if (!name.toLowerCase().endsWith(".docx")) throw bad("Solo se admite el formato DOCX.");
            byte[] content = document.getBytes();
            if (content.length < 4 || content[0] != 'P' || content[1] != 'K'
                || content[2] != 3 || content[3] != 4) {
                throw bad("El archivo no es un documento DOCX válido.");
            }
            boolean validContentTypes = false;
            boolean wordDocument = false;
            try (ZipInputStream zip = new ZipInputStream(new ByteArrayInputStream(content))) {
                for (var entry = zip.getNextEntry(); entry != null; entry = zip.getNextEntry()) {
                    if ("[Content_Types].xml".equals(entry.getName())) {
                        byte[] xml = zip.readNBytes(64 * 1024 + 1);
                        if (xml.length <= 64 * 1024) {
                            String types = new String(xml, StandardCharsets.UTF_8);
                            validContentTypes = types.contains("PartName=\"/word/document.xml\"")
                                && types.contains(DOCX_MAIN_CONTENT_TYPE);
                        }
                    }
                    if ("word/document.xml".equals(entry.getName())) wordDocument = true;
                }
            }
            if (!validContentTypes || !wordDocument) throw bad("El archivo no es un documento DOCX válido.");
            return content;
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (Exception exception) {
            throw bad("No se pudo validar el documento RFC.");
        }
    }

    private ChangeResponse requireAssigned(long id, WorkflowActor actor) {
        ChangeResponse change = requireChange(id);
        if (change.implementerId() == null || change.implementerId() != actor.id()) throw forbidden();
        return change;
    }
    private ChangeResponse requireChange(long id) {
        ChangeResponse value = repository.find(id);
        if (value == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "RFC no encontrada.");
        return value;
    }
    private void requireRole(WorkflowActor actor, String role) { if (!role.equals(actor.role())) throw forbidden(); }
    private long nullable(Long value) { return value == null ? -1 : value; }
    private String text(String value) { return value == null ? "" : value.trim(); }
    private String safeName(String value) {
        String name = value == null ? "RFC.docx" : value.replace('\\', '/');
        name = name.substring(name.lastIndexOf('/') + 1).replaceAll("[^A-Za-z0-9._ -]", "_");
        return name.isBlank() ? "RFC.docx" : name;
    }
    private String sha256(byte[] content) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(content)); }
        catch (Exception exception) { throw new IllegalStateException("No se pudo calcular la integridad del documento", exception); }
    }
    private String riskLevel(String probability, String impact) {
        int p = switch (probability) { case "ALTA" -> 3; case "MEDIA" -> 2; default -> 1; };
        int i = switch (impact) { case "ALTO" -> 3; case "MEDIO" -> 2; default -> 1; };
        int score = p * i;
        return score >= 6 ? "ALTO" : score >= 3 ? "MEDIO" : "BAJO";
    }
    private ResponseStatusException forbidden() { return new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permisos para esta operación."); }
    private ResponseStatusException bad(String message) { return new ResponseStatusException(HttpStatus.BAD_REQUEST, message); }
    private ResponseStatusException conflict(String message) { return new ResponseStatusException(HttpStatus.CONFLICT, message); }
    private void notifyRoles(List<String> roles, String title, String message, String link) {
        try { notifications.notifyUsersWithRoles(roles, title, message, "GESTION_CAMBIO", link); } catch (RuntimeException ignored) { }
    }
    private void notifyUser(Long id, String title, String message, String link) {
        if (id == null) return;
        try { notifications.notifyUser(id, title, message, "GESTION_CAMBIO", link); } catch (RuntimeException ignored) { }
    }
}
