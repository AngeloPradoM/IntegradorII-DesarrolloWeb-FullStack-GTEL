package pe.com.gtel.talento.recruitment.dto;

import java.util.List;

public record EvaluationRequest(
        Long candidateId,
        Long postulacionId,
        Long applicationId,

        String test,
        String tipoEvaluacion,

        Integer score,
        Integer puntajeTotal,

        Integer time,
        Integer tiempoMin,
        Integer minutes,

        String resultado, // 'aprobado', 'en_revision', 'no_aprobado'
        String status,

        List<EvaluationCriterionRequest> criteria,
        List<EvaluationCriterionRequest> details
) {
    public EvaluationRequest(
            Long candidateId,
            Long postulacionId,
            String test,
            String tipoEvaluacion,
            Integer score,
            Integer puntajeTotal,
            Integer time,
            Integer tiempoMin,
            String resultado,
            List<EvaluationCriterionRequest> criteria,
            List<EvaluationCriterionRequest> details
    ) {
        this(candidateId, postulacionId, postulacionId, test, tipoEvaluacion, score, puntajeTotal, time, tiempoMin, time != null ? time : tiempoMin, resultado, resultado, criteria, details);
    }

    public Long getTargetId() {
        if (applicationId != null) return applicationId;
        if (postulacionId != null) return postulacionId;
        return candidateId;
    }

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

    public Integer getTiempoMinutos() {
        if (minutes != null && minutes > 0) return minutes;
        if (time != null && time > 0) return time;
        if (tiempoMin != null && tiempoMin > 0) return tiempoMin;
        return 45;
    }
}
