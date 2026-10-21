package pe.com.gtel.talento.recruitment.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;

class CvStorageServiceTest {

    @TempDir
    Path tempDir;

    private CvStorageService storageService;

    @BeforeEach
    void setUp() {
        storageService = new CvStorageService(tempDir.toString());
    }

    @Test
    void storeValidPdfSuccessfully() {
        // PDF Magic Bytes: %PDF (0x25, 0x50, 0x44, 0x46)
        byte[] pdfContent = new byte[]{0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x37, 0x0A, 0x25};
        MockMultipartFile file = new MockMultipartFile("cv", "cv_candidato.pdf", "application/pdf", pdfContent);

        CvStorageService.StoredCv stored = storageService.store(file, 10L);

        assertNotNull(stored);
        assertTrue(stored.storedFilename().startsWith("cv_10_"));
        assertTrue(stored.storedFilename().endsWith(".pdf"));
        assertEquals("cv_candidato.pdf", stored.originalFilename());
        assertTrue(stored.downloadUrl().contains(stored.storedFilename()));
        assertEquals("application/pdf", stored.contentType());

        // Verificar que el archivo existe en disco
        Resource resource = storageService.loadAsResource(stored.storedFilename());
        assertTrue(resource.exists());
    }

    @Test
    void storeValidDocxSuccessfully() {
        // DOCX Magic Bytes (ZIP): PK\x03\x04 (0x50, 0x4B, 0x03, 0x04)
        byte[] docxContent = new byte[]{0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00};
        MockMultipartFile file = new MockMultipartFile("cv", "curriculum.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", docxContent);

        CvStorageService.StoredCv stored = storageService.store(file, 20L);

        assertNotNull(stored);
        assertTrue(stored.storedFilename().endsWith(".docx"));
        assertEquals("application/vnd.openxmlformats-officedocument.wordprocessingml.document", stored.contentType());
    }

    @Test
    void rejectEmptyFile() {
        MockMultipartFile emptyFile = new MockMultipartFile("cv", "cv.pdf", "application/pdf", new byte[0]);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> storageService.store(emptyFile, 1L));
        assertTrue(ex.getReason().contains("vacío"));
    }

    @Test
    void rejectExecutableDisguisedAsPdf() {
        // MZ Magic Bytes (Windows Executable / PE)
        byte[] exeContent = new byte[]{0x4D, 0x5A, (byte) 0x90, 0x00, 0x03, 0x00, 0x00, 0x00};
        MockMultipartFile fakePdf = new MockMultipartFile("cv", "malware.pdf", "application/pdf", exeContent);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> storageService.store(fakePdf, 1L));
        assertTrue(ex.getReason().toLowerCase().contains("ejecutable") || ex.getReason().toLowerCase().contains("firma binaria"));
    }

    @Test
    void rejectInvalidExtension() {
        byte[] content = new byte[]{0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34};
        MockMultipartFile shFile = new MockMultipartFile("cv", "script.sh", "application/x-sh", content);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> storageService.store(shFile, 1L));
        assertTrue(ex.getReason().toLowerCase().contains("formato") || ex.getReason().toLowerCase().contains("extensión"));
    }

    @Test
    void rejectPathTraversalInResourceLoad() {
        assertThrows(ResponseStatusException.class, () -> storageService.loadAsResource("../../../windows/system32/cmd.exe"));
        assertThrows(ResponseStatusException.class, () -> storageService.loadAsResource("..\\secret.txt"));
    }
}
