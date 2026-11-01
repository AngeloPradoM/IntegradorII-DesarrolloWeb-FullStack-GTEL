package pe.com.gtel.talento.changemanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ChangeCreateRequest(
    @NotBlank @Size(max = 160) String title,
    @NotBlank @Pattern(regexp = "ESTANDAR|NORMAL|EMERGENCIA") String type,
    @NotBlank @Pattern(regexp = "HARDWARE|SOFTWARE|RED|SEGURIDAD|BASE_DATOS|INFRAESTRUCTURA|OTRO") String category,
    @NotBlank @Pattern(regexp = "BAJA|MEDIA|ALTA|CRITICA") String priority,
    @NotBlank @Pattern(regexp = "BAJO|MEDIO|ALTO") String impact,
    @NotBlank @Pattern(regexp = "BAJA|MEDIA|ALTA") String urgency,
    @NotBlank @Size(max = 3000) String description,
    @NotBlank @Size(max = 2000) String justification,
    @NotBlank @Size(max = 1000) String affectedAreas
) {}
