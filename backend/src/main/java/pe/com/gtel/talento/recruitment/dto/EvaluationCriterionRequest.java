package pe.com.gtel.talento.recruitment.dto;

public record EvaluationCriterionRequest(
        String area,
        String criterio,
        Integer score,
        Integer puntaje,
        Integer weight,
        Integer porcentaje,
        String observacion
) {
    public String getNombreCriterio() {
        if (criterio != null && !criterio.isBlank()) return criterio.trim();
        if (area != null && !area.isBlank()) return area.trim();
        return "Criterio General";
    }

    public int getValorPuntaje() {
        if (puntaje != null) return Math.clamp(puntaje, 0, 100);
        if (score != null) return Math.clamp(score, 0, 100);
        return 70;
    }

    public Integer getValorPorcentaje() {
        if (porcentaje != null) return porcentaje;
        return weight;
    }
}
