package pe.com.gtel.talento.recruitment.service;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import pe.com.gtel.talento.identity.entity.Usuario;
import pe.com.gtel.talento.identity.repository.UsuarioRepository;
import pe.com.gtel.talento.recruitment.dto.EvaluationCriterionRequest;
import pe.com.gtel.talento.recruitment.dto.EvaluationRequest;
import pe.com.gtel.talento.recruitment.dto.EvaluationResponse;
import pe.com.gtel.talento.recruitment.entity.Evaluacion;
import pe.com.gtel.talento.recruitment.entity.EvaluacionDetalle;
import pe.com.gtel.talento.recruitment.entity.Postulacion;
import pe.com.gtel.talento.recruitment.entity.PostulacionTimeline;
import pe.com.gtel.talento.recruitment.repository.EvaluacionRepository;
import pe.com.gtel.talento.recruitment.repository.PostulacionRepository;
import pe.com.gtel.talento.recruitment.repository.PostulacionTimelineRepository;

@Service
public class EvaluationService {

    private final EvaluacionRepository evaluacionRepository;
    private final PostulacionRepository postulacionRepository;
    private final PostulacionTimelineRepository timelineRepository;
    private final UsuarioRepository usuarioRepository;

    public EvaluationService(
            EvaluacionRepository evaluacionRepository,
            PostulacionRepository postulacionRepository,
            PostulacionTimelineRepository timelineRepository,
            UsuarioRepository usuarioRepository
    ) {
        this.evaluacionRepository = evaluacionRepository;
        this.postulacionRepository = postulacionRepository;
        this.timelineRepository = timelineRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional(readOnly = true)
    public List<EvaluationResponse> getRecruiterEvaluations() {
        return evaluacionRepository.findByOrderByFechaEvaluacionDescIdDesc().stream()
                .map(EvaluationResponse::fromEntity)
                .toList();
    }

    @Transactional
    public EvaluationResponse createEvaluation(EvaluationRequest request, String evaluatorEmail) {
        Long targetId = request.postulacionId() != null ? request.postulacionId() : request.candidateId();
        if (targetId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debes especificar el candidato o postulación.");
        }

        Postulacion postulacion = postulacionRepository.findById(targetId)
                .or(() -> postulacionRepository.findFirstByPostulanteIdOrderByFechaPostulacionDesc(targetId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró una postulación activa para el identificador: " + targetId));

        List<EvaluationCriterionRequest> criteriaList = request.getListaCriterios();

        int finalScore;
        if (!criteriaList.isEmpty()) {
            double sum = 0;
            for (EvaluationCriterionRequest c : criteriaList) {
                sum += c.getValorPuntaje();
            }
            finalScore = (int) Math.round(sum / criteriaList.size());
        } else if (request.score() != null) {
            finalScore = Math.clamp(request.score(), 0, 100);
        } else if (request.puntajeTotal() != null) {
            finalScore = Math.clamp(request.puntajeTotal(), 0, 100);
        } else {
            finalScore = 75;
        }

        String resultado;
        if (request.resultado() != null && !request.resultado().isBlank()) {
            String raw = request.resultado().trim().toLowerCase();
            resultado = switch (raw) {
                case "aprobado", "passed" -> "aprobado";
                case "no_aprobado", "failed", "descartado" -> "no_aprobado";
                default -> "en_revision";
            };
        } else {
            if (finalScore >= 75) {
                resultado = "aprobado";
            } else if (finalScore >= 60) {
                resultado = "en_revision";
            } else {
                resultado = "no_aprobado";
            }
        }

        Usuario evaluador = (evaluatorEmail != null && !evaluatorEmail.isBlank())
                ? usuarioRepository.findByEmailIgnoreCase(evaluatorEmail.trim()).orElse(null)
                : null;

        Evaluacion evaluacion = new Evaluacion(
                postulacion,
                request.getNombreTest(),
                finalScore,
                request.time() != null ? request.time() : (request.tiempoMin() != null ? request.tiempoMin() : 45),
                resultado,
                evaluador
        );

        if (!criteriaList.isEmpty()) {
            for (EvaluationCriterionRequest c : criteriaList) {
                evaluacion.addDetalle(new EvaluacionDetalle(
                        c.getNombreCriterio(),
                        c.getValorPuntaje(),
                        c.getValorPorcentaje(),
                        c.observacion()
                ));
            }
        } else {
            evaluacion.addDetalle(new EvaluacionDetalle("Criterio Técnico General", finalScore, 100, "Evaluación general completada"));
        }

        evaluacion = evaluacionRepository.save(evaluacion);

        // Actualizar el puntaje general ATS en la postulación
        postulacion.setPuntajeGeneral(finalScore);
        postulacionRepository.save(postulacion);

        // Registrar auditoría en timeline
        String timelineComment = "Evaluación registrada: " + request.getNombreTest() +
                ". Puntaje general: " + finalScore + "/100 (" + resultado + ").";

        PostulacionTimeline timelineEvent = new PostulacionTimeline(
                postulacion,
                postulacion.getEstado(),
                postulacion.getEstado(),
                timelineComment,
                evaluador
        );
        timelineRepository.save(timelineEvent);

        return EvaluationResponse.fromEntity(evaluacion);
    }
}
