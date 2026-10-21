package pe.com.gtel.talento.recruitment.dto;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import pe.com.gtel.talento.recruitment.entity.Postulacion;
import pe.com.gtel.talento.recruitment.entity.PostulacionTimeline;

public record ApplicationResponse(
        Long id,
        String code,
        String codigo,
        String candidateId,
        Long jobId,
        String job,
        String company,
        String location,
        String department,
        String status,
        String date,
        String appliedDate,
        String createdAt,
        CvInfo cv,
        List<TimelineStepResponse> steps
) {
    public record CvInfo(
            String name,
            String url
    ) {}

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.forLanguageTag("es-PE"));
    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public static ApplicationResponse fromEntity(Postulacion p, List<PostulacionTimeline> timelineList) {
        String formattedDate = p.getFechaPostulacion() != null
                ? p.getFechaPostulacion().format(DATE_FORMATTER)
                : "";
        String isoDate = p.getFechaPostulacion() != null
                ? p.getFechaPostulacion().format(ISO_FORMATTER)
                : "";

        String candidateIdStr = p.getPostulante() != null ? String.valueOf(p.getPostulante().getId()) : "";
        Long jobIdVal = p.getVacante() != null ? p.getVacante().getId() : null;
        String jobTitle = p.getVacante() != null ? p.getVacante().getTitulo() : "Convocatoria GTEL";
        String loc = p.getVacante() != null ? p.getVacante().getSede() : "Lima, Perú";
        String deptName = (p.getVacante() != null && p.getVacante().getDepartamento() != null)
                ? p.getVacante().getDepartamento().getNombre()
                : "General";

        CvInfo cvInfo = new CvInfo(
                p.getCvNombre() != null ? p.getCvNombre() : "CV.pdf",
                p.getCvUrl() != null ? p.getCvUrl() : ""
        );

        List<TimelineStepResponse> steps = buildSteps(p.getEstado(), formattedDate, timelineList);

        return new ApplicationResponse(
                p.getId(),
                p.getCodigo(),
                p.getCodigo(),
                candidateIdStr,
                jobIdVal,
                jobTitle,
                "GTEL Telecomunicaciones",
                loc,
                deptName,
                p.getEstado() != null ? p.getEstado().toLowerCase(Locale.ROOT) : "recibida",
                formattedDate,
                formattedDate,
                isoDate,
                cvInfo,
                steps
        );
    }

    /**
     * Construye los hitos del proceso acordes al estado actual de la postulación
     */
    private static List<TimelineStepResponse> buildSteps(String status, String postulationDate, List<PostulacionTimeline> timelineList) {
        List<TimelineStepResponse> steps = new ArrayList<>();
        String st = status != null ? status.toLowerCase(Locale.ROOT) : "recibida";

        // Paso 1: Postulación recibida
        String step1Comment = "Tu postulación ha sido recibida y registrada en el sistema de selección de GTEL.";
        String step1Date = postulationDate;
        if (timelineList != null && !timelineList.isEmpty()) {
            step1Date = timelineList.get(0).getFechaCambio().format(DATE_FORMATTER);
            if (timelineList.get(0).getComentario() != null && !timelineList.get(0).getComentario().isBlank()) {
                step1Comment = timelineList.get(0).getComentario();
            }
        }
        steps.add(new TimelineStepResponse("Postulación enviada", step1Date, true, "recibida".equals(st), false, step1Comment));

        // Paso 2: Revisión curricular
        boolean isRevDone = !"recibida".equals(st);
        boolean isRevActive = "en_revision".equals(st);
        steps.add(new TimelineStepResponse("Revisión curricular", isRevDone ? step1Date : "-", isRevDone, isRevActive, false,
                isRevActive ? "El equipo de selección está revisando tu perfil profesional." : "Evaluación de requisitos mínimos y experiencia."));

        // Paso 3: Entrevista
        boolean isEntDone = "entrevista".equals(st) || "aprobada".equals(st);
        boolean isEntActive = "entrevista".equals(st);
        steps.add(new TimelineStepResponse("Entrevista con RRHH", isEntDone ? step1Date : "-", isEntDone, isEntActive, false,
                isEntActive ? "Has sido convocado a entrevista. Revisa las indicaciones enviadas a tu correo." : "Entrevista por competencias y adecuación al puesto."));

        // Paso 4: Decisión final
        if ("rechazada".equals(st)) {
            steps.add(new TimelineStepResponse("Proceso finalizado", step1Date, true, false, true,
                    "En esta ocasión el proceso no continuó para tu perfil. ¡Gracias por participar en GTEL!"));
        } else {
            boolean isApproved = "aprobada".equals(st);
            steps.add(new TimelineStepResponse("Seleccionado / Aprobado", isApproved ? step1Date : "-", isApproved, false, false,
                    isApproved ? "¡Felicitaciones! Has sido seleccionado para cubrir la vacante." : "Decisión final de contratación."));
        }

        return steps;
    }
}
