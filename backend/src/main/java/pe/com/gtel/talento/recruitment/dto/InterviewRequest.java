package pe.com.gtel.talento.recruitment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record InterviewRequest(
        @NotNull(message = "El identificador del candidato o postulación es obligatorio")
        Long candidateId,

        Long postulacionId,

        @NotBlank(message = "La fecha de la entrevista es obligatoria")
        String date,

        @NotBlank(message = "La hora de la entrevista es obligatoria")
        String time,

        Integer durationMin,

        String type, // "video" | "presencial"

        String location, // URL de Teams/Meet o Sede física

        String notes
) {}
