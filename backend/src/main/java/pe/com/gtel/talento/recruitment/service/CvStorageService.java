package pe.com.gtel.talento.recruitment.service;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.Locale;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CvStorageService {

    public static final long MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

    // Magic bytes signatures
    // PDF: %PDF (0x25, 0x50, 0x44, 0x46)
    private static final byte[] PDF_MAGIC = new byte[]{0x25, 0x50, 0x44, 0x46};
    // DOCX (ZIP archive header): PK\x03\x04 (0x50, 0x4B, 0x03, 0x04)
    private static final byte[] ZIP_MAGIC = new byte[]{0x50, 0x4B, 0x03, 0x04};
    // DOC (OLE Compound File): D0 CF 11 E0 A1 B1 1A E1
    private static final byte[] DOC_OLE_MAGIC = new byte[]{(byte) 0xD0, (byte) 0xCF, 0x11, (byte) 0xE0, (byte) 0xA1, (byte) 0xB1, 0x1A, (byte) 0xE1};

    private final Path rootDir;

    public CvStorageService(@Value("${app.upload.cv-dir:uploads/cv}") String uploadDir) {
        this.rootDir = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.rootDir);
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo inicializar el directorio de almacenamiento de CVs: " + this.rootDir, e);
        }
    }

    public record StoredCv(
            String storedFilename,
            String originalFilename,
            String downloadUrl,
            long sizeBytes,
            String contentType
    ) {}

    /**
     * Valida la extensión, el tamaño y los Magic Bytes del archivo, y lo almacena de forma segura en disco.
     */
    public StoredCv store(MultipartFile file, Long candidateId) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debes adjuntar tu archivo de currículum (CV). El archivo está vacío.");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El archivo excede el tamaño máximo permitido de 10 MB.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            originalFilename = "curriculum.pdf";
        }

        String extension = extractExtension(originalFilename);
        validateMagicBytes(file, extension);

        String safeExtension = switch (extension) {
            case "pdf" -> "pdf";
            case "docx" -> "docx";
            case "doc" -> "doc";
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Formato no permitido. Solo se aceptan archivos PDF o Word (.docx/.doc).");
        };

        String uniqueFilename = String.format("cv_%d_%d_%s.%s",
                candidateId != null ? candidateId : 0L,
                System.currentTimeMillis(),
                UUID.randomUUID().toString().substring(0, 8),
                safeExtension);

        Path destination = this.rootDir.resolve(uniqueFilename).normalize().toAbsolutePath();
        if (!destination.startsWith(this.rootDir)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ruta de archivo no permitida.");
        }

        try (InputStream is = file.getInputStream()) {
            Files.copy(is, destination, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al guardar el archivo de CV.", e);
        }

        String downloadUrl = "/api/candidate/cv/" + uniqueFilename;
        String contentType = determineContentType(safeExtension);

        return new StoredCv(uniqueFilename, originalFilename, downloadUrl, file.getSize(), contentType);
    }

    public Resource loadAsResource(String filename) {
        try {
            if (filename == null || filename.isBlank() || filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nombre de archivo no válido.");
            }
            Path filePath = this.rootDir.resolve(filename).normalize().toAbsolutePath();
            if (!filePath.startsWith(this.rootDir) || !Files.exists(filePath) || !Files.isReadable(filePath)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El archivo solicitado no existe o no está disponible.");
            }
            return new UrlResource(filePath.toUri());
        } catch (MalformedURLException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No se pudo leer el archivo solicitado.", e);
        }
    }

    public String determineContentType(String extension) {
        return switch (extension.toLowerCase(Locale.ROOT)) {
            case "pdf" -> "application/pdf";
            case "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case "doc" -> "application/msword";
            default -> "application/octet-stream";
        };
    }

    private String extractExtension(String filename) {
        int dot = filename.lastIndexOf('.');
        if (dot < 0 || dot == filename.length() - 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El archivo debe tener una extensión válida (.pdf, .docx, .doc).");
        }
        return filename.substring(dot + 1).toLowerCase(Locale.ROOT).trim();
    }

    /**
     * Valida los Magic Bytes inspeccionando los primeros bytes reales del flujo binario.
     */
    public void validateMagicBytes(MultipartFile file, String claimedExtension) {
        byte[] header = new byte[8];
        int bytesRead;
        try (InputStream is = file.getInputStream()) {
            bytesRead = is.read(header);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se pudo leer el contenido del archivo.");
        }

        if (bytesRead < 4) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El archivo está dañado o incompleto.");
        }

        boolean isValid = switch (claimedExtension) {
            case "pdf" -> matchBytes(header, PDF_MAGIC);
            case "docx" -> matchBytes(header, ZIP_MAGIC);
            case "doc" -> matchBytes(header, DOC_OLE_MAGIC) || matchBytes(header, ZIP_MAGIC);
            default -> false;
        };

        if (!isValid) {
            // Verificamos si tiene cabeceras de ejecutables peligrosos para mensaje más descriptivo
            if (header[0] == 0x4D && header[1] == 0x5A) { // 'MZ' Windows DOS/PE
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Seguridad: Se detectó un archivo ejecutable disfrazado. Postulación rechazada.");
            }
            if (header[0] == 0x7F && header[1] == 0x45 && header[2] == 0x4C && header[3] == 0x46) { // ELF
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Seguridad: Archivo binario ejecutable no permitido.");
            }
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El archivo no es un documento PDF o Word válido (la firma binaria no coincide con la extensión " + claimedExtension + ").");
        }
    }

    private boolean matchBytes(byte[] target, byte[] expected) {
        if (target.length < expected.length) return false;
        return Arrays.equals(Arrays.copyOf(target, expected.length), expected);
    }

    public boolean deleteCvFile(String filename) {
        if (filename == null || filename.isBlank()) return false;
        try {
            if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
                return false;
            }
            Path filePath = this.rootDir.resolve(filename).normalize().toAbsolutePath();
            if (filePath.startsWith(this.rootDir) && Files.exists(filePath)) {
                return Files.deleteIfExists(filePath);
            }
        } catch (IOException ignored) {}
        return false;
    }

    public Path getRootDir() {
        return rootDir;
    }
}
