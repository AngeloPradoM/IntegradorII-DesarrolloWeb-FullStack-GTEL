package pe.com.gtel.talento.privacy.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record DataExportResponse(
        String baseLegal,
        LocalDateTime fechaExportacion,
        TitularData titular,
        ConsentimientoData consentimiento,
        List<PostulacionData> postulaciones,
        List<EntrevistaData> entrevistas,
        List<EvaluacionData> evaluaciones,
        List<TimelineData> historialEventos
) {
    public record TitularData(
            Long id,
            String nombres,
            String apellidos,
            String dni,
            String telefono,
            String email,
            String fechaNacimiento,
            String experiencia,
            String educacion,
            String estado
    ) {}

    public record ConsentimientoData(
            Boolean otorgado,
            LocalDateTime fechaAceptacion,
            String versionPolitica,
            String finalidad
    ) {}

    public record PostulacionData(
            Long id,
            String codigo,
            Long vacanteId,
            String vacanteTitulo,
            String vacanteArea,
            String estado,
            Integer puntajeGeneral,
            LocalDateTime fechaPostulacion,
            String cvNombre
    ) {}

    public record EntrevistaData(
            Long id,
            String codigoPostulacion,
            String vacanteTitulo,
            LocalDateTime fechaHora,
            Integer duracionMinutos,
            String modalidad,
            String enlace,
            String estado
    ) {}

    public record EvaluacionData(
            Long id,
            String tipoPrueba,
            Integer puntajePonderado,
            String estado,
            LocalDateTime fechaEvaluacion,
            List<Map<String, Object>> criterios
    ) {}

    public record TimelineData(
            Long postulacionId,
            String codigoPostulacion,
            String estadoAnterior,
            String estadoNuevo,
            LocalDateTime fechaCambio,
            String comentario
    ) {}
}
