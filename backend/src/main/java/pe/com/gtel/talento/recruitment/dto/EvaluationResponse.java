package pe.com.gtel.talento.recruitment.dto;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import pe.com.gtel.talento.recruitment.entity.Evaluacion;

public record EvaluationResponse(
        String id,
        String candidateId,
        String name,
        String job,
        String test,
        String status, // 'passed', 'review', 'failed'
        Integer score,
        String time,
        String date,
        List<Map<String, Object>> details
) {
    public static EvaluationResponse fromEntity(Evaluacion e) {
        var post = e.getPostulacion();
        var cand = post != null ? post.getPostulante() : null;
        var vac = post != null ? post.getVacante() : null;

        String candidateName = cand != null ? (cand.getNombres() + " " + cand.getApellidos()).trim() : "Candidato";
        String candidateIdStr = cand != null ? String.valueOf(cand.getId()) : "1";
        String jobTitle = vac != null ? vac.getTitulo() : "Vacante";

        String rawResultado = e.getResultado() != null ? e.getResultado().toLowerCase() : "en_revision";
        String statusMapped = switch (rawResultado) {
            case "aprobado", "passed" -> "passed";
            case "no_aprobado", "failed", "rechazado" -> "failed";
            default -> "review";
        };

        String dateStr = e.getFechaEvaluacion() != null
                ? e.getFechaEvaluacion().format(DateTimeFormatter.ISO_LOCAL_DATE)
                : "";

        String timeStr = (e.getTiempoMin() != null ? e.getTiempoMin() : 45) + " min";

        List<Map<String, Object>> detailsList = e.getDetalles().stream()
                .map(d -> Map.<String, Object>of(
                        "area", d.getCriterio(),
                        "score", d.getPuntaje()
                ))
                .toList();

        return new EvaluationResponse(
                String.valueOf(e.getId()),
                candidateIdStr,
                candidateName,
                jobTitle,
                e.getTipoEvaluacion(),
                statusMapped,
                e.getPuntajeTotal(),
                timeStr,
                dateStr,
                detailsList
        );
    }
}
