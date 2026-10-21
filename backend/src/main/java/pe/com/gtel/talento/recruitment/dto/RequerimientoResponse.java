package pe.com.gtel.talento.recruitment.dto;

public record RequerimientoResponse(
    Long id,
    String titulo,
    Long departamentoId,
    String departamentoNombre,
    Long solicitanteId,
    String solicitanteEmail,
    Integer cantidad,
    String estado,
    String fechaSolicitud,
    String fechaAprobacion,
    String descripcion,
    String observaciones
) {}
