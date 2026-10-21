package pe.com.gtel.talento.recruitment.service;

import java.security.SecureRandom;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import pe.com.gtel.talento.identity.entity.Postulante;
import pe.com.gtel.talento.identity.entity.Usuario;
import pe.com.gtel.talento.identity.repository.PostulanteRepository;
import pe.com.gtel.talento.identity.repository.UsuarioRepository;
import pe.com.gtel.talento.recruitment.dto.ApplicationResponse;
import pe.com.gtel.talento.recruitment.dto.ApplicationSubmitRequest;
import pe.com.gtel.talento.recruitment.entity.Postulacion;
import pe.com.gtel.talento.recruitment.entity.PostulacionTimeline;
import pe.com.gtel.talento.recruitment.entity.Vacante;
import pe.com.gtel.talento.recruitment.repository.PostulacionRepository;
import pe.com.gtel.talento.recruitment.repository.PostulacionTimelineRepository;
import pe.com.gtel.talento.recruitment.repository.VacanteRepository;

@Service
@Transactional
public class CandidateApplicationService {

    private final PostulacionRepository postulacionRepository;
    private final PostulacionTimelineRepository timelineRepository;
    private final VacanteRepository vacanteRepository;
    private final PostulanteRepository postulanteRepository;
    private final UsuarioRepository usuarioRepository;
    private final CvStorageService cvStorageService;
    private final pe.com.gtel.talento.notification.service.NotificationService notificationService;
    private final SecureRandom secureRandom = new SecureRandom();

    public CandidateApplicationService(
            PostulacionRepository postulacionRepository,
            PostulacionTimelineRepository timelineRepository,
            VacanteRepository vacanteRepository,
            PostulanteRepository postulanteRepository,
            UsuarioRepository usuarioRepository,
            CvStorageService cvStorageService,
            pe.com.gtel.talento.notification.service.NotificationService notificationService) {
        this.postulacionRepository = postulacionRepository;
        this.timelineRepository = timelineRepository;
        this.vacanteRepository = vacanteRepository;
        this.postulanteRepository = postulanteRepository;
        this.usuarioRepository = usuarioRepository;
        this.cvStorageService = cvStorageService;
        this.notificationService = notificationService;
    }

    public ApplicationResponse submitApplication(
            Long jobId,
            ApplicationSubmitRequest request,
            MultipartFile cvFile,
            String candidateEmail) {

        if (candidateEmail == null || candidateEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Debes iniciar sesión para postular.");
        }

        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(candidateEmail.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado."));

        if (!usuario.isActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tu cuenta no está activa.");
        }

        if (jobId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debes especificar la vacante a la que deseas postular.");
        }

        Vacante vacante = vacanteRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Oferta laboral no encontrada."));

        if (!"activa".equalsIgnoreCase(vacante.getEstado())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Esta convocatoria no está activa para recibir postulaciones.");
        }

        if (request.getTermsAccepted() == null || !request.getTermsAccepted()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debes aceptar los términos y condiciones de tratamiento de datos personales.");
        }

        Postulante postulante = postulanteRepository.findByUsuarioEmailIgnoreCase(candidateEmail.trim())
                .orElseGet(() -> {
                    String nom = (request.getNombres() != null && !request.getNombres().isBlank()) ? request.getNombres().trim() : "Postulante";
                    String ape = (request.getApellidos() != null && !request.getApellidos().isBlank()) ? request.getApellidos().trim() : "";
                    Postulante p = new Postulante(usuario, nom, ape);
                    return postulanteRepository.save(p);
                });

        // Actualizar datos de contacto si fueron provistos
        if (request.getNombres() != null && !request.getNombres().isBlank()) {
            postulante.setNombres(request.getNombres().trim());
        }
        if (request.getApellidos() != null && !request.getApellidos().isBlank()) {
            postulante.setApellidos(request.getApellidos().trim());
        }
        if (request.getTelefono() != null && !request.getTelefono().isBlank()) {
            postulante.setTelefono(request.getTelefono().trim());
        }
        if (request.getDni() != null && !request.getDni().isBlank()) {
            postulante.setDni(request.getDni().trim());
        }
        postulanteRepository.save(postulante);

        // Validar postulación duplicada
        if (postulacionRepository.existsByPostulanteIdAndVacanteId(postulante.getId(), vacante.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya has postulado a esta oferta de trabajo.");
        }

        // Subida segura del CV y validación de Magic Bytes
        CvStorageService.StoredCv storedCv = cvStorageService.store(cvFile, postulante.getId());
        postulante.setCvUrl(storedCv.downloadUrl());
        postulanteRepository.save(postulante);

        // Generar código único de seguimiento: GTEL-2026-XXXX
        String uniqueCode = generateUniqueApplicationCode();

        Postulacion postulacion = new Postulacion(
                uniqueCode,
                postulante,
                vacante,
                storedCv.downloadUrl(),
                storedCv.originalFilename()
        );
        postulacion = postulacionRepository.save(postulacion);

        // Registrar primer hito en el timeline
        PostulacionTimeline primerHito = new PostulacionTimeline(
                postulacion,
                null,
                "recibida",
                "Postulación registrada exitosamente a través del portal de empleo.",
                usuario
        );
        timelineRepository.save(primerHito);

        try {
            if (notificationService != null) {
                notificationService.notifyStaff(
                        "Nueva postulación recibida",
                        postulante.getNombres() + " " + postulante.getApellidos() + " se ha postulado a \"" + vacante.getTitulo() + "\".",
                        "POSTULACION_NUEVA",
                        "/reclutador/postulantes"
                );
                notificationService.notifyUser(
                        usuario.getId(),
                        "Postulación recibida con éxito",
                        "Tu postulación a \"" + vacante.getTitulo() + "\" fue registrada con código " + postulacion.getCodigo() + ".",
                        "POSTULACION_REGISTRADA",
                        "/mis-postulaciones"
                );
            }
        } catch (Exception ignored) {}

        return ApplicationResponse.fromEntity(postulacion, List.of(primerHito));
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponse> getCandidateApplications(String candidateEmail) {
        if (candidateEmail == null || candidateEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Inicia sesión como candidato.");
        }
        List<Postulacion> list = postulacionRepository.findByCandidateEmail(candidateEmail.trim());
        return list.stream()
                .map(p -> {
                    List<PostulacionTimeline> timeline = timelineRepository.findByPostulacionIdOrderByFechaCambioAsc(p.getId());
                    return ApplicationResponse.fromEntity(p, timeline);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public ApplicationResponse getCandidateApplication(Long id, String candidateEmail) {
        Postulacion p = postulacionRepository.findByIdAndCandidateEmail(id, candidateEmail.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Postulación no encontrada."));
        List<PostulacionTimeline> timeline = timelineRepository.findByPostulacionIdOrderByFechaCambioAsc(p.getId());
        return ApplicationResponse.fromEntity(p, timeline);
    }

    @Transactional(readOnly = true)
    public Resource loadCvFile(String filename, String requestingUserEmail, boolean isStaff) {
        if (!isStaff) {
            // Verificar si el postulante es dueño de este CV
            List<Postulacion> userApps = postulacionRepository.findByCandidateEmail(requestingUserEmail);
            boolean ownsFile = userApps.stream().anyMatch(a -> a.getCvUrl() != null && a.getCvUrl().contains(filename));
            if (!ownsFile) {
                // Verificar en el perfil del postulante
                Postulante postulante = postulanteRepository.findByUsuarioEmailIgnoreCase(requestingUserEmail).orElse(null);
                if (postulante == null || postulante.getCvUrl() == null || !postulante.getCvUrl().contains(filename)) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permiso para acceder a este currículum.");
                }
            }
        }
        return cvStorageService.loadAsResource(filename);
    }

    private String generateUniqueApplicationCode() {
        for (int i = 0; i < 20; i++) {
            int randomNum = 1000 + secureRandom.nextInt(9000);
            String code = String.format(Locale.ROOT, "GTEL-2026-%04d", randomNum);
            if (!postulacionRepository.existsByCodigo(code)) {
                return code;
            }
        }
        // Fallback hexadecimal
        return "GTEL-2026-" + Integer.toHexString(secureRandom.nextInt(0xFFFFFF)).toUpperCase(Locale.ROOT);
    }

    public Map<String, Object> updateCandidateStatus(Long candidateOrAppId, String rawStatus, String comment, String recruiterEmail) {
        if (candidateOrAppId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Identificador de candidato o postulación requerido.");
        }

        String normalized = switch (rawStatus != null ? rawStatus.toLowerCase(Locale.ROOT).trim() : "") {
            case "recibida", "recibido", "new" -> "recibida";
            case "en_revision", "revision", "en revision", "reviewing", "review" -> "en_revision";
            case "entrevista", "interview" -> "entrevista";
            case "aprobada", "aprobado", "approved" -> "aprobada";
            case "rechazada", "rechazado", "rejected" -> "rechazada";
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado no válido para el proceso: " + rawStatus);
        };

        Postulacion postulacion = postulacionRepository.findById(candidateOrAppId)
                .or(() -> postulacionRepository.findFirstByPostulanteIdOrderByFechaPostulacionDesc(candidateOrAppId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró una postulación para el identificador " + candidateOrAppId));

        String estadoAnterior = postulacion.getEstado();
        postulacion.setEstado(normalized);
        Postulacion saved = postulacionRepository.save(postulacion);

        Usuario recruiter = (recruiterEmail != null && !recruiterEmail.isBlank())
                ? usuarioRepository.findByEmailIgnoreCase(recruiterEmail.trim()).orElse(null)
                : null;

        String finalComment = (comment != null && !comment.isBlank())
                ? comment.trim()
                : getDefaultStatusComment(normalized);

        PostulacionTimeline timelineEvent = new PostulacionTimeline(
                saved,
                estadoAnterior,
                normalized,
                finalComment,
                recruiter
        );
        timelineRepository.save(timelineEvent);

        try {
            if (notificationService != null && saved.getPostulante() != null && saved.getPostulante().getUsuario() != null) {
                Long candidateUserId = saved.getPostulante().getUsuario().getId();
                String faseLegible = switch (normalized) {
                    case "recibida" -> "Recibida";
                    case "en_revision" -> "En Revisión";
                    case "entrevista" -> "Entrevista Técnica";
                    case "aprobada" -> "Aprobada";
                    case "rechazada" -> "Finalizada";
                    default -> normalized;
                };
                notificationService.notifyUser(
                        candidateUserId,
                        "Actualización de postulación",
                        "Tu postulación a \"" + saved.getVacante().getTitulo() + "\" ha cambiado de estado a: " + faseLegible + ".",
                        "CANDIDATO_FASE",
                        "/mis-postulaciones"
                );
            }
        } catch (Exception ignored) {}

        Map<String, Object> map = new HashMap<>();
        map.put("id", saved.getPostulante().getId());
        map.put("name", saved.getPostulante().getNombres() + " " + saved.getPostulante().getApellidos());
        map.put("job", saved.getVacante().getTitulo());
        map.put("email", saved.getPostulante().getEmail());
        map.put("phone", saved.getPostulante().getTelefono() != null ? saved.getPostulante().getTelefono() : "");
        map.put("dni", saved.getPostulante().getDni() != null ? saved.getPostulante().getDni() : "");
        map.put("location", saved.getVacante().getSede() != null ? saved.getVacante().getSede() : "Lima, Perú");
        map.put("department", (saved.getVacante().getDepartamento() != null) ? saved.getVacante().getDepartamento().getNombre() : "");
        map.put("cvUrl", saved.getCvUrl() != null ? saved.getCvUrl() : "");
        map.put("date", saved.getFechaPostulacion() != null ? saved.getFechaPostulacion().format(DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.forLanguageTag("es-PE"))) : "");
        map.put("status", normalized);
        map.put("score", saved.getPuntajeGeneral());
        map.put("code", saved.getCodigo());
        return map;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getCandidateTimeline(Long candidateOrAppId) {
        Postulacion postulacion = postulacionRepository.findById(candidateOrAppId)
                .or(() -> postulacionRepository.findFirstByPostulanteIdOrderByFechaPostulacionDesc(candidateOrAppId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Postulación no encontrada para el identificador " + candidateOrAppId));

        return timelineRepository.findByPostulacionIdOrderByFechaCambioAsc(postulacion.getId()).stream()
                .map(t -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", t.getId());
                    map.put("previousStatus", t.getEstadoAnterior());
                    map.put("newStatus", t.getEstadoNuevo());
                    map.put("comment", t.getComentario());
                    map.put("date", t.getFechaCambio().format(DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm", Locale.forLanguageTag("es-PE"))));
                    map.put("userEmail", t.getUsuario() != null ? t.getUsuario().getEmail() : "Sistema");
                    return map;
                })
                .toList();
    }

    private String getDefaultStatusComment(String status) {
        return switch (status) {
            case "recibida" -> "Postulación registrada en estado inicial.";
            case "en_revision" -> "El candidato ha sido promovido a etapa de revisión curricular.";
            case "entrevista" -> "El candidato ha sido convocado a fase de entrevista técnica o por competencias.";
            case "aprobada" -> "Candidato aprobado satisfactoriamente en el proceso de selección.";
            case "rechazada" -> "Candidato descartado en esta etapa del proceso.";
            default -> "Actualización de fase en el proceso de selección.";
        };
    }
}
