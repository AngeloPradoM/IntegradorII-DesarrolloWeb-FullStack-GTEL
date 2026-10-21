package pe.com.gtel.talento.recruitment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record RequerimientoStatusRequest(
    @NotBlank(message = "El nuevo estado es obligatorio")
    @Pattern(regexp = "pendiente|aprobado|rechazado|cerrado", message = "Estado inválido. Opciones: pendiente, aprobado, rechazado, cerrado")
    String estado,

    String observaciones
) {}
