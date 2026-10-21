package pe.com.gtel.talento.recruitment.dto;

import java.time.format.DateTimeFormatter;
import pe.com.gtel.talento.recruitment.entity.Entrevista;

public record InterviewResponse(
        String id,
        String name,
        String job,
        String date,
        String time,
        String duration,
        String type,
        String location,
        String interviewer,
        String status,
        String notes,
        Long candidateId,
        Long postulacionId
) {
    public static InterviewResponse fromEntity(Entrevista e, String interviewerEmail) {
        var post = e.getPostulacion();
        var cand = post != null ? post.getPostulante() : null;
        var vac = post != null ? post.getVacante() : null;

        String candidateName = cand != null ? (cand.getNombres() + " " + cand.getApellidos()).trim() : "Candidato";
        String jobTitle = vac != null ? vac.getTitulo() : "Vacante";
        String formattedDate = e.getFecha() != null ? e.getFecha().format(DateTimeFormatter.ISO_LOCAL_DATE) : "";
        String formattedTime = e.getHora() != null ? e.getHora().format(DateTimeFormatter.ofPattern("HH:mm")) : "N/D";
        String durationStr = (e.getDuracionMin() != null ? e.getDuracionMin() : 30) + " min";
        String typeStr = "presencial".equalsIgnoreCase(e.getTipo()) ? "Presencial" : "Videollamada";
        String locationStr = e.getUbicacion() != null && !e.getUbicacion().isBlank() ? e.getUbicacion() : "Enlace pendiente";
        String interviewerStr = (interviewerEmail != null && !interviewerEmail.isBlank()) ? interviewerEmail : "Equipo de Reclutamiento";

        return new InterviewResponse(
                String.valueOf(e.getId()),
                candidateName,
                jobTitle,
                formattedDate,
                formattedTime,
                durationStr,
                typeStr,
                locationStr,
                interviewerStr,
                e.getEstado() != null ? e.getEstado() : "programada",
                "Entrevista programada para el proceso de selección",
                cand != null ? cand.getId() : null,
                post != null ? post.getId() : null
        );
    }
}
