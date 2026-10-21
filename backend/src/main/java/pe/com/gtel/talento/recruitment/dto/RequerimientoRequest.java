package pe.com.gtel.talento.recruitment.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RequerimientoRequest(
    @NotBlank(message = "El título de la posición solicitada es obligatorio")
    @Size(max = 150, message = "El título no puede exceder 150 caracteres")
    String titulo,

    @NotNull(message = "El departamento es obligatorio")
    Long departamentoId,

    @NotBlank(message = "La descripción y perfil requerido son obligatorios")
    String descripcion,

    @NotNull(message = "La cantidad de vacantes solicitadas es obligatoria")
    @Min(value = 1, message = "Debe solicitar al menos 1 vacante")
    Integer cantidad,

    String observaciones
) {}
