package pe.com.gtel.talento.recruitment.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record EvaluationRequest(
        @NotNull(message = "El identificador del candidato o postulación es obligatorio")
        Long candidateId,

        Long postulacionId,

        String test,
        String tipoEvaluacion,

        Integer score,
        Integer puntajeTotal,

        Integer time,
        Integer tiempoMin,

        String resultado, // 'aprobado', 'en_revision', 'no_aprobado' (o 'passed', 'review', 'failed')

        List<EvaluationCriterionRequest> criteria,
        List<EvaluationCriterionRequest> details
) {
    public String getNombreTest() {
        if (tipoEvaluacion != null && !tipoEvaluacion.isBlank()) return tipoEvaluacion.trim();
        if (test != null && !test.isBlank()) return test.trim();
        return "Evaluación Técnica General";
    }

    public List<EvaluationCriterionRequest> getListaCriterios() {
        if (criteria != null && !criteria.isEmpty()) return criteria;
        if (details != null && !details.isEmpty()) return details;
        return List.of();
    }
}
