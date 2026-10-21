package pe.com.gtel.talento.recruitment.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;
import pe.com.gtel.talento.identity.entity.Postulante;
import pe.com.gtel.talento.identity.entity.Rol;
import pe.com.gtel.talento.identity.entity.Usuario;
import pe.com.gtel.talento.identity.repository.UsuarioRepository;
import pe.com.gtel.talento.recruitment.dto.EvaluationCriterionRequest;
import pe.com.gtel.talento.recruitment.dto.EvaluationRequest;
import pe.com.gtel.talento.recruitment.dto.EvaluationResponse;
import pe.com.gtel.talento.recruitment.entity.Evaluacion;
import pe.com.gtel.talento.recruitment.entity.EvaluacionDetalle;
import pe.com.gtel.talento.recruitment.entity.Postulacion;
import pe.com.gtel.talento.recruitment.entity.Vacante;
import pe.com.gtel.talento.recruitment.repository.EvaluacionRepository;
import pe.com.gtel.talento.recruitment.repository.PostulacionRepository;
import pe.com.gtel.talento.recruitment.repository.PostulacionTimelineRepository;

@ExtendWith(MockitoExtension.class)
class EvaluationServiceTest {

    @Mock
    private EvaluacionRepository evaluacionRepository;
    @Mock
    private PostulacionRepository postulacionRepository;
    @Mock
    private PostulacionTimelineRepository timelineRepository;
    @Mock
    private UsuarioRepository usuarioRepository;

    private EvaluationService evaluationService;

    @BeforeEach
    void setUp() {
        evaluationService = new EvaluationService(
                evaluacionRepository,
                postulacionRepository,
                timelineRepository,
                usuarioRepository
        );
    }

    @Test
    @DisplayName("Listar evaluaciones retorna lista mapeada con detalles")
    void shouldReturnEvaluationsList() {
        Postulante postulante = new Postulante(null, "Mario", "Vargas");
        postulante.setId(15L);
        Vacante vacante = new Vacante();
        vacante.setTitulo("Asesor Comercial");

        Postulacion postulacion = new Postulacion("GTEL-2026-0003", postulante, vacante, null, null);
        postulacion.setId(3L);

        Evaluacion evaluacion = new Evaluacion(postulacion, "Prueba Psicométrica", 88, 40, "aprobado", null);
        evaluacion.setId(50L);
        evaluacion.addDetalle(new EvaluacionDetalle("Liderazgo", 90, 50, "Excelente"));
        evaluacion.addDetalle(new EvaluacionDetalle("Trabajo en Equipo", 86, 50, "Muy bueno"));

        when(evaluacionRepository.findByOrderByFechaEvaluacionDescIdDesc()).thenReturn(List.of(evaluacion));

        List<EvaluationResponse> result = evaluationService.getRecruiterEvaluations();

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Mario Vargas", result.get(0).name());
        assertEquals("Prueba Psicométrica", result.get(0).test());
        assertEquals(88, result.get(0).score());
        assertEquals("passed", result.get(0).status());
        assertEquals(2, result.get(0).details().size());
    }

    @Test
    @DisplayName("Crear evaluación calcula puntaje promedio de criterios y actualiza puntaje general de postulación")
    void shouldCreateEvaluationAndCalculateScore() {
        Postulante postulante = new Postulante(null, "Lucia", "Ramos");
        postulante.setId(25L);
        Vacante vacante = new Vacante();
        vacante.setTitulo("Especialista RRHH");

        Postulacion postulacion = new Postulacion("GTEL-2026-0004", postulante, vacante, null, null);
        postulacion.setId(4L);

        when(postulacionRepository.findById(4L)).thenReturn(Optional.of(postulacion));
        when(usuarioRepository.findByEmailIgnoreCase("evaluador@gtel.com.pe")).thenReturn(Optional.of(new Usuario("evaluador@gtel.com.pe", "hash", new Rol("RECLUTADOR", ""))));
        when(evaluacionRepository.save(any(Evaluacion.class))).thenAnswer(i -> {
            Evaluacion ev = i.getArgument(0);
            ev.setId(300L);
            return ev;
        });

        EvaluationRequest request = new EvaluationRequest(
                25L,
                4L,
                "Evaluación por Competencias",
                null,
                null,
                null,
                45,
                null,
                null,
                List.of(
                        new EvaluationCriterionRequest("Comunicación Asertiva", null, 80, null, 50, null, "Fluida"),
                        new EvaluationCriterionRequest("Resolución de Conflictos", null, 90, null, 50, null, "Efectiva")
                ),
                null
        );

        EvaluationResponse response = evaluationService.createEvaluation(request, "evaluador@gtel.com.pe");

        assertNotNull(response);
        assertEquals("Lucia Ramos", response.name());
        // Promedio de 80 y 90 = 85
        assertEquals(85, response.score());
        assertEquals("passed", response.status());
        assertEquals(85, postulacion.getPuntajeGeneral());

        verify(postulacionRepository).save(postulacion);
        verify(timelineRepository).save(any());
        verify(evaluacionRepository).save(any(Evaluacion.class));
    }

    @Test
    @DisplayName("Lanza excepción si postulación no existe")
    void shouldThrowWhenPostulationNotFound() {
        when(postulacionRepository.findById(888L)).thenReturn(Optional.empty());
        when(postulacionRepository.findFirstByPostulanteIdOrderByFechaPostulacionDesc(888L)).thenReturn(Optional.empty());

        EvaluationRequest request = new EvaluationRequest(
                888L,
                null,
                "Test",
                null,
                80,
                null,
                30,
                null,
                "aprobado",
                null,
                null
        );

        assertThrows(ResponseStatusException.class, () -> evaluationService.createEvaluation(request, "eval@gtel.com.pe"));
    }
}
