package pe.com.gtel.talento.recruitment.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import pe.com.gtel.talento.identity.entity.Usuario;
import pe.com.gtel.talento.identity.repository.UsuarioRepository;
import pe.com.gtel.talento.recruitment.dto.InterviewRequest;
import pe.com.gtel.talento.recruitment.dto.InterviewResponse;
import pe.com.gtel.talento.recruitment.entity.Entrevista;
import pe.com.gtel.talento.recruitment.entity.Postulacion;
import pe.com.gtel.talento.recruitment.entity.PostulacionTimeline;
import pe.com.gtel.talento.recruitment.repository.EntrevistaRepository;
import pe.com.gtel.talento.recruitment.repository.PostulacionRepository;
import pe.com.gtel.talento.recruitment.repository.PostulacionTimelineRepository;

@Service
public class InterviewService {

    private final EntrevistaRepository entrevistaRepository;
    private final PostulacionRepository postulacionRepository;
    private final PostulacionTimelineRepository timelineRepository;
    private final UsuarioRepository usuarioRepository;
    private final pe.com.gtel.talento.notification.service.NotificationService notificationService;

    public InterviewService(
            EntrevistaRepository entrevistaRepository,
            PostulacionRepository postulacionRepository,
            PostulacionTimelineRepository timelineRepository,
            UsuarioRepository usuarioRepository,
            pe.com.gtel.talento.notification.service.NotificationService notificationService
    ) {
        this.entrevistaRepository = entrevistaRepository;
        this.postulacionRepository = postulacionRepository;
        this.timelineRepository = timelineRepository;
        this.usuarioRepository = usuarioRepository;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<InterviewResponse> getRecruiterInterviews() {
        return entrevistaRepository.findByOrderByFechaAscHoraAsc().stream()
                .map(e -> InterviewResponse.fromEntity(e, null))
                .toList();
    }

    @Transactional
    public InterviewResponse scheduleInterview(InterviewRequest request, String recruiterEmail) {
        Long targetId = request.postulacionId() != null ? request.postulacionId() : request.candidateId();
        if (targetId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debes especificar el candidato o postulación.");
        }

        Postulacion postulacion = postulacionRepository.findById(targetId)
                .or(() -> postulacionRepository.findFirstByPostulanteIdOrderByFechaPostulacionDesc(targetId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró una postulación activa para el identificador: " + targetId));

        LocalDate parsedDate;
        try {
            parsedDate = LocalDate.parse(request.date().trim(), DateTimeFormatter.ISO_LOCAL_DATE);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Formato de fecha inválido. Se espera YYYY-MM-DD.");
        }

        LocalTime parsedTime;
        try {
            String timeStr = request.time().trim();
            if (timeStr.length() == 5) timeStr += ":00";
            parsedTime = LocalTime.parse(timeStr);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Formato de hora inválido. Se espera HH:mm.");
        }

        String rawType = request.type() != null ? request.type().trim().toLowerCase() : "video";
        String normalizedType = rawType.contains("presencial") ? "presencial" : "video";

        String location = request.location() != null && !request.location().isBlank()
                ? request.location().trim()
                : (normalizedType.equals("video") ? "https://teams.microsoft.com/l/meetup-join/gtel-talento" : "Sede Central GTEL - Av. Principal 123");

        Entrevista entrevista = new Entrevista(
                postulacion,
                parsedDate,
                parsedTime,
                request.durationMin() != null ? request.durationMin() : 30,
                normalizedType,
                location
        );
        entrevista = entrevistaRepository.save(entrevista);

        // Promover automáticamente el estado de la postulación a "entrevista"
        String estadoAnterior = postulacion.getEstado();
        postulacion.setEstado("entrevista");
        postulacionRepository.save(postulacion);

        Usuario recruiter = (recruiterEmail != null && !recruiterEmail.isBlank())
                ? usuarioRepository.findByEmailIgnoreCase(recruiterEmail.trim()).orElse(null)
                : null;

        String timelineComment = "Entrevista " + ("presencial".equals(normalizedType) ? "presencial" : "virtual") +
                " programada para el " + parsedDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) +
                " a las " + parsedTime.format(DateTimeFormatter.ofPattern("HH:mm")) + ". Ubicación: " + location;

        PostulacionTimeline timelineEvent = new PostulacionTimeline(
                postulacion,
                estadoAnterior,
                "entrevista",
                timelineComment,
                recruiter
        );
        timelineRepository.save(timelineEvent);

        try {
            if (notificationService != null) {
                if (postulacion.getPostulante() != null && postulacion.getPostulante().getUsuario() != null) {
                    Long candUserId = postulacion.getPostulante().getUsuario().getId();
                    notificationService.notifyUser(
                            candUserId,
                            "Entrevista programada",
                            "Se ha programado tu entrevista para el " + parsedDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + " a las " + parsedTime.format(DateTimeFormatter.ofPattern("HH:mm")) + ".",
                            "ENTREVISTA_PROGRAMADA",
                            "/mis-postulaciones"
                    );
                }
                String candidateName = (postulacion.getPostulante() != null)
                        ? postulacion.getPostulante().getNombres() + " " + postulacion.getPostulante().getApellidos()
                        : "Candidato";
                notificationService.notifyUsersWithRoles(
                        java.util.List.of("RECLUTADOR", "ADMIN", "ENTREVISTADOR"),
                        "Entrevista agendada",
                        "Entrevista programada con " + candidateName + " para el " + parsedDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + " a las " + parsedTime.format(DateTimeFormatter.ofPattern("HH:mm")) + ".",
                        "ENTREVISTA_PROGRAMADA",
                        "/reclutador/entrevistas"
                );
            }
        } catch (Exception ignored) {}

        return InterviewResponse.fromEntity(entrevista, recruiterEmail);
    }
}
