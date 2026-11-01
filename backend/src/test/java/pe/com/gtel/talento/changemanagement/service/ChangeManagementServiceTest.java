package pe.com.gtel.talento.changemanagement.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.matches;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import pe.com.gtel.talento.changemanagement.dto.ChangeCreateRequest;
import pe.com.gtel.talento.changemanagement.dto.ChangeDecisionRequest;
import pe.com.gtel.talento.changemanagement.dto.ChangeExecutionRequest;
import pe.com.gtel.talento.changemanagement.dto.ChangeResponse;
import pe.com.gtel.talento.changemanagement.repository.ChangeManagementRepository;
import pe.com.gtel.talento.identity.dto.WorkflowActor;
import pe.com.gtel.talento.identity.service.WorkflowIdentity;
import pe.com.gtel.talento.notification.service.NotificationService;

@ExtendWith(MockitoExtension.class)
class ChangeManagementServiceTest {
    private static final String DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    @Mock private ChangeManagementRepository repository;
    @Mock private WorkflowIdentity identity;
    @Mock private NotificationService notifications;
    @InjectMocks private ChangeManagementService service;

    @Test
    void normalChangeRequiresCabParticipants() {
        when(identity.actor("admin@gtel.test")).thenReturn(new WorkflowActor(1L, "ADMIN"));
        when(repository.find(8L)).thenReturn(change("NORMAL", "PENDIENTE_APROBACION", 10L, 20L));

        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> service.decide(
            8L, new ChangeDecisionRequest(true, "MEDIA", "MEDIO", "Aprobado", ""), "admin@gtel.test"));

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        verifyNoInteractions(notifications);
    }

    @Test
    void requesterCannotApproveItsOwnChange() {
        when(identity.actor("admin@gtel.test")).thenReturn(new WorkflowActor(10L, "ADMIN"));
        when(repository.find(8L)).thenReturn(change("NORMAL", "PENDIENTE_APROBACION", 10L, 20L));

        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> service.decide(
            8L, new ChangeDecisionRequest(true, "BAJA", "BAJO", "Aprobado", "TI, negocio y calidad"), "admin@gtel.test"));

        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
    }

    @Test
    void technicianCannotExecuteBeforeApproval() {
        when(identity.actor("tecnico@gtel.test")).thenReturn(new WorkflowActor(20L, "TECNICO"));
        when(repository.find(8L)).thenReturn(change("NORMAL", "PENDIENTE_APROBACION", 10L, 20L));

        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> service.execute(
            8L, new ChangeExecutionRequest("Capturas", "EXITOSO", "Sin desviaciones"), "tecnico@gtel.test"));

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
    }

    @Test
    void rejectsDocumentLargerThanTenMegabytesBeforeReadingIt() throws Exception {
        when(identity.actor("reclutador@gtel.test")).thenReturn(new WorkflowActor(10L, "RECLUTADOR"));
        MultipartFile document = mock(MultipartFile.class);
        when(document.isEmpty()).thenReturn(false);
        when(document.getSize()).thenReturn(10L * 1024 * 1024 + 1);

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
            () -> service.create(request(), document, "reclutador@gtel.test"));

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        verifyNoInteractions(repository, notifications);
    }

    @Test
    void rejectsZipThatIsNotARealWordprocessingDocument() throws Exception {
        when(identity.actor("reclutador@gtel.test")).thenReturn(new WorkflowActor(10L, "RECLUTADOR"));
        byte[] content = docx("text/plain");
        MockMultipartFile document = new MockMultipartFile("document", "RFC.docx", DOCX_MIME, content);

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
            () -> service.create(request(), document, "reclutador@gtel.test"));

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        verifyNoInteractions(repository, notifications);
    }

    @Test
    void storesValidDocxWithSanitizedFilenameAndSha256() throws Exception {
        when(identity.actor("reclutador@gtel.test")).thenReturn(new WorkflowActor(10L, "RECLUTADOR"));
        when(repository.create(eq(10L), any(ChangeCreateRequest.class))).thenReturn(8L);
        when(repository.find(8L)).thenReturn(change("NORMAL", "REGISTRADO", 10L, null));
        MockMultipartFile document = new MockMultipartFile(
            "document", "../../RFC_finál.docx", DOCX_MIME, docx(
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"));

        service.create(request(), document, "reclutador@gtel.test");

        verify(repository).saveDocument(eq(8L), eq(10L), eq("RFC_fin_l.docx"), eq(DOCX_MIME),
            any(byte[].class), matches("[0-9a-f]{64}"));
    }

    @Test
    void candidateCannotDownloadChangeTemplate() {
        when(identity.actor("candidato@gtel.test")).thenReturn(new WorkflowActor(30L, "CANDIDATO"));

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
            () -> service.authorizeTemplateDownload("candidato@gtel.test"));

        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
        verifyNoInteractions(repository, notifications);
    }

    private ChangeCreateRequest request() {
        return new ChangeCreateRequest("Actualizar servidor", "NORMAL", "INFRAESTRUCTURA", "ALTA",
            "ALTO", "MEDIA", "Actualizar componentes", "Reducir riesgo", "Operaciones");
    }

    private byte[] docx(String mainContentType) throws Exception {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        try (ZipOutputStream zip = new ZipOutputStream(output)) {
            zip.putNextEntry(new ZipEntry("[Content_Types].xml"));
            zip.write(("<Types><Override PartName=\"/word/document.xml\" ContentType=\""
                + mainContentType + "\"/></Types>").getBytes(java.nio.charset.StandardCharsets.UTF_8));
            zip.closeEntry();
            zip.putNextEntry(new ZipEntry("word/document.xml"));
            zip.write("<w:document/>".getBytes(java.nio.charset.StandardCharsets.UTF_8));
            zip.closeEntry();
        }
        return output.toByteArray();
    }

    private ChangeResponse change(String type, String status, long requesterId, Long implementerId) {
        LocalDateTime now = LocalDateTime.of(2026, 11, 1, 12, 0);
        return new ChangeResponse(
            8L, "RFC-2026-0008", "Actualizar servidor", type, "INFRAESTRUCTURA", "ALTA",
            "ALTO", "MEDIA", "Actualizar componentes", "Reducir riesgo", "Operaciones",
            status, requesterId, "reclutador@gtel.test", implementerId, "tecnico@gtel.test",
            implementerId, "tecnico@gtel.test", "Evaluación", "Implementación", "Pruebas",
            "Reversa", "Comunicación", null, null, null, null, null, null, null, null, null,
            "RFC.docx", now, now, null, null, null);
    }
}
