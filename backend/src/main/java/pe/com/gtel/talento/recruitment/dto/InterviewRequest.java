package pe.com.gtel.talento.recruitment.dto;

import jakarta.validation.constraints.NotBlank;

public record InterviewRequest(
        Long candidateId,
        Long postulacionId,
        Long applicationId,

        @NotBlank(message = "La fecha de la entrevista es obligatoria")
        String date,

        @NotBlank(message = "La hora de la entrevista es obligatoria")
        String time,

        Integer durationMin,
        Integer minutes,

        String type, // "video" | "presencial"

        String location, // URL de Teams/Meet o Sede física

        String status,

        String notes
) {
    public InterviewRequest(
            Long candidateId,
            Long postulacionId,
            String date,
            String time,
            Integer durationMin,
            String type,
            String location,
            String notes
    ) {
        this(candidateId, postulacionId, postulacionId, date, time, durationMin, durationMin, type, location, "programada", notes);
    }

    public Long getTargetId() {
        if (applicationId != null) return applicationId;
        if (postulacionId != null) return postulacionId;
        return candidateId;
    }

    public int getDuracionMinutos() {
        if (durationMin != null && durationMin > 0) return durationMin;
        if (minutes != null && minutes > 0) return minutes;
        return 30;
    }
}
