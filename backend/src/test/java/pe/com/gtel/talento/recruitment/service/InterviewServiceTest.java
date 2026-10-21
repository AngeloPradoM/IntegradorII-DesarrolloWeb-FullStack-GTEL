package pe.com.gtel.talento.recruitment.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.time.LocalTime;
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
import pe.com.gtel.talento.recruitment.dto.InterviewRequest;
import pe.com.gtel.talento.recruitment.dto.InterviewResponse;
import pe.com.gtel.talento.recruitment.entity.Entrevista;
import pe.com.gtel.talento.recruitment.entity.Postulacion;
import pe.com.gtel.talento.recruitment.entity.Vacante;
import pe.com.gtel.talento.recruitment.repository.EntrevistaRepository;
import pe.com.gtel.talento.recruitment.repository.PostulacionRepository;
import pe.com.gtel.talento.recruitment.repository.PostulacionTimelineRepository;

@ExtendWith(MockitoExtension.class)
class InterviewServiceTest {

    @Mock
    private EntrevistaRepository entrevistaRepository;
    @Mock
    private PostulacionRepository postulacionRepository;
    @Mock
    private PostulacionTimelineRepository timelineRepository;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private pe.com.gtel.talento.notification.service.NotificationService notificationService;

    private InterviewService interviewService;

    @BeforeEach
    void setUp() {
        interviewService = new InterviewService(
                entrevistaRepository,
                postulacionRepository,
                timelineRepository,
                usuarioRepository,
                notificationService
        );
    }

    @Test
    @DisplayName("Listar entrevistas retorna lista formateada")
    void shouldReturnInterviewsList() {
        Postulante postulante = new Postulante(null, "Carlos", "Perez");
        postulante.setId(10L);
        Vacante vacante = new Vacante();
        vacante.setTitulo("Desarrollador");

        Postulacion postulacion = new Postulacion("GTEL-2026-0001", postulante, vacante, null, null);
        postulacion.setId(1L);

        Entrevista entrevista = new Entrevista(
                postulacion,
                LocalDate.of(2026, 10, 15),
                LocalTime.of(10, 30),
                45,
                "video",
                "https://teams.microsoft.com/meet"
        );
        entrevista.setId(100L);

        when(entrevistaRepository.findByOrderByFechaAscHoraAsc()).thenReturn(List.of(entrevista));

        List<InterviewResponse> result = interviewService.getRecruiterInterviews();

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Carlos Perez", result.get(0).name());
        assertEquals("Desarrollador", result.get(0).job());
        assertEquals("2026-10-15", result.get(0).date());
        assertEquals("10:30", result.get(0).time());
    }

    @Test
    @DisplayName("Programar entrevista actualiza estado de postulación y crea hito en timeline")
    void shouldScheduleInterviewAndUpdatePostulationStatus() {
        Postulante postulante = new Postulante(null, "Ana", "Gomez");
        postulante.setId(20L);
        Vacante vacante = new Vacante();
        vacante.setTitulo("Soporte Tecnico");

        Postulacion postulacion = new Postulacion("GTEL-2026-0002", postulante, vacante, null, null);
        postulacion.setId(2L);
        postulacion.setEstado("en_revision");

        when(postulacionRepository.findById(2L)).thenReturn(Optional.of(postulacion));
        when(usuarioRepository.findByEmailIgnoreCase("reclutador@gtel.com.pe")).thenReturn(Optional.of(new Usuario("reclutador@gtel.com.pe", "hash", new Rol("RECLUTADOR", ""))));
        when(entrevistaRepository.save(any(Entrevista.class))).thenAnswer(i -> {
            Entrevista e = i.getArgument(0);
            e.setId(200L);
            return e;
        });

        InterviewRequest request = new InterviewRequest(
                20L,
                2L,
                "2026-10-20",
                "15:00",
                30,
                "presencial",
                "Sede Central Lima",
                "Entrevista presencial con jefatura"
        );

        InterviewResponse response = interviewService.scheduleInterview(request, "reclutador@gtel.com.pe");

        assertNotNull(response);
        assertEquals("Ana Gomez", response.name());
        assertEquals("2026-10-20", response.date());
        assertEquals("15:00", response.time());
        assertEquals("Presencial", response.type());
        assertEquals("entrevista", postulacion.getEstado());

        verify(postulacionRepository).save(postulacion);
        verify(timelineRepository).save(any());
        verify(entrevistaRepository).save(any(Entrevista.class));
    }

    @Test
    @DisplayName("Lanza excepción si la postulación no existe")
    void shouldThrowWhenPostulationNotFound() {
        when(postulacionRepository.findById(999L)).thenReturn(Optional.empty());
        when(postulacionRepository.findFirstByPostulanteIdOrderByFechaPostulacionDesc(999L)).thenReturn(Optional.empty());

        InterviewRequest request = new InterviewRequest(
                999L,
                null,
                "2026-10-20",
                "15:00",
                30,
                "video",
                null,
                null
        );

        assertThrows(ResponseStatusException.class, () -> interviewService.scheduleInterview(request, "recruiter@gtel.com.pe"));
    }
}
