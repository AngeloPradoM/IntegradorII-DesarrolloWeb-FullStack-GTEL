package pe.com.gtel.talento.recruitment.service;

import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;
import pe.com.gtel.talento.identity.entity.Postulante;
import pe.com.gtel.talento.identity.entity.Rol;
import pe.com.gtel.talento.identity.entity.Usuario;
import pe.com.gtel.talento.identity.repository.PostulanteRepository;
import pe.com.gtel.talento.identity.repository.UsuarioRepository;
import pe.com.gtel.talento.recruitment.dto.ApplicationResponse;
import pe.com.gtel.talento.recruitment.dto.ApplicationSubmitRequest;
import pe.com.gtel.talento.recruitment.entity.Departamento;
import pe.com.gtel.talento.recruitment.entity.Postulacion;
import pe.com.gtel.talento.recruitment.entity.PostulacionTimeline;
import pe.com.gtel.talento.recruitment.entity.Vacante;
import pe.com.gtel.talento.recruitment.repository.PostulacionRepository;
import pe.com.gtel.talento.recruitment.repository.PostulacionTimelineRepository;
import pe.com.gtel.talento.recruitment.repository.VacanteRepository;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CandidateApplicationServiceTest {

    @Mock
    private PostulacionRepository postulacionRepository;

    @Mock
    private PostulacionTimelineRepository timelineRepository;

    @Mock
    private VacanteRepository vacanteRepository;

    @Mock
    private PostulanteRepository postulanteRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private CvStorageService cvStorageService;

    @Mock
    private pe.com.gtel.talento.notification.service.NotificationService notificationService;

    @InjectMocks
    private CandidateApplicationService service;

    private Usuario candidatoUser;
    private Postulante postulante;
    private Vacante vacante;
    private MockMultipartFile cvFile;

    @BeforeEach
    void setUp() {
        candidatoUser = new Usuario("postulante1@gmail.com", "hash", new Rol("CANDIDATO", ""));
        postulante = new Postulante(candidatoUser, "Carlos", "Alvarez");
        postulante.setTelefono("987654321");

        Departamento dep = new Departamento(1L, "Ventas", "Área comercial", "activo");
        vacante = new Vacante();
        vacante.setId(5L);
        vacante.setTitulo("Asesor Outbound");
        vacante.setDepartamento(dep);
        vacante.setEstado("activa");

        byte[] pdfBytes = new byte[]{0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34};
        cvFile = new MockMultipartFile("cv", "cv.pdf", "application/pdf", pdfBytes);
    }

    @Test
    void submitApplicationSuccess() {
        when(usuarioRepository.findByEmailIgnoreCase("postulante1@gmail.com")).thenReturn(Optional.of(candidatoUser));
        when(vacanteRepository.findById(5L)).thenReturn(Optional.of(vacante));
        when(postulanteRepository.findByUsuarioEmailIgnoreCase("postulante1@gmail.com")).thenReturn(Optional.of(postulante));
        when(postulacionRepository.existsByPostulanteIdAndVacanteId(any(), eq(5L))).thenReturn(false);
        when(cvStorageService.store(eq(cvFile), any())).thenReturn(
                new CvStorageService.StoredCv("cv_1_123.pdf", "cv.pdf", "/api/candidate/cv/cv_1_123.pdf", 100L, "application/pdf")
        );
        when(postulacionRepository.existsByCodigo(anyString())).thenReturn(false);
        when(postulacionRepository.save(any(Postulacion.class))).thenAnswer(inv -> {
            Postulacion p = inv.getArgument(0);
            p.setId(101L);
            return p;
        });

        ApplicationSubmitRequest req = new ApplicationSubmitRequest();
        req.setJobId(5L);
        req.setNombres("Carlos");
        req.setApellidos("Alvarez");
        req.setTelefono("987654321");
        req.setTermsAccepted(true);

        ApplicationResponse res = service.submitApplication(5L, req, cvFile, "postulante1@gmail.com");

        assertNotNull(res);
        assertEquals(101L, res.id());
        assertTrue(res.code().startsWith("GTEL-2026-"));
        assertEquals("Asesor Outbound", res.job());
        assertEquals("recibida", res.status());
        assertNotNull(res.steps());
        assertFalse(res.steps().isEmpty());
        assertEquals("Postulación enviada", res.steps().get(0).label());

        verify(timelineRepository, times(1)).save(any(PostulacionTimeline.class));
    }

    @Test
    void rejectDuplicateApplication() {
        when(usuarioRepository.findByEmailIgnoreCase("postulante1@gmail.com")).thenReturn(Optional.of(candidatoUser));
        when(vacanteRepository.findById(5L)).thenReturn(Optional.of(vacante));
        when(postulanteRepository.findByUsuarioEmailIgnoreCase("postulante1@gmail.com")).thenReturn(Optional.of(postulante));
        when(postulacionRepository.existsByPostulanteIdAndVacanteId(any(), eq(5L))).thenReturn(true);

        ApplicationSubmitRequest req = new ApplicationSubmitRequest();
        req.setJobId(5L);
        req.setTermsAccepted(true);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.submitApplication(5L, req, cvFile, "postulante1@gmail.com"));

        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Ya has postulado"));
    }

    @Test
    void rejectInactiveJobApplication() {
        vacante.setEstado("cerrada");
        when(usuarioRepository.findByEmailIgnoreCase("postulante1@gmail.com")).thenReturn(Optional.of(candidatoUser));
        when(vacanteRepository.findById(5L)).thenReturn(Optional.of(vacante));

        ApplicationSubmitRequest req = new ApplicationSubmitRequest();
        req.setJobId(5L);
        req.setTermsAccepted(true);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.submitApplication(5L, req, cvFile, "postulante1@gmail.com"));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("no está activa"));
    }

    @Test
    void rejectWhenTermsNotAccepted() {
        when(usuarioRepository.findByEmailIgnoreCase("postulante1@gmail.com")).thenReturn(Optional.of(candidatoUser));
        when(vacanteRepository.findById(5L)).thenReturn(Optional.of(vacante));

        ApplicationSubmitRequest req = new ApplicationSubmitRequest();
        req.setJobId(5L);
        req.setTermsAccepted(false);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.submitApplication(5L, req, cvFile, "postulante1@gmail.com"));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("términos y condiciones"));
    }

    @Test
    void getCandidateApplicationsReturnsList() {
        Postulacion p = new Postulacion("GTEL-2026-1111", postulante, vacante, "/api/candidate/cv/file.pdf", "file.pdf");
        p.setId(1L);

        when(postulacionRepository.findByCandidateEmail("postulante1@gmail.com")).thenReturn(List.of(p));
        when(timelineRepository.findByPostulacionIdOrderByFechaCambioAsc(1L)).thenReturn(List.of());

        List<ApplicationResponse> list = service.getCandidateApplications("postulante1@gmail.com");

        assertNotNull(list);
        assertEquals(1, list.size());
        assertEquals("GTEL-2026-1111", list.get(0).code());
        assertEquals("Asesor Outbound", list.get(0).job());
    }

    @Test
    void updateCandidateStatusSuccessfully() {
        Postulacion p = new Postulacion("GTEL-2026-1111", postulante, vacante, "/api/candidate/cv/file.pdf", "file.pdf");
        p.setId(10L);
        p.setEstado("recibida");

        when(postulacionRepository.findById(10L)).thenReturn(Optional.of(p));
        when(postulacionRepository.save(any(Postulacion.class))).thenAnswer(inv -> inv.getArgument(0));

        var updated = service.updateCandidateStatus(10L, "en_revision", "Revisión curricular aprobada", "reclutador1@gmail.com");

        assertNotNull(updated);
        assertEquals("en_revision", updated.get("status"));
        assertEquals("en_revision", p.getEstado());
        verify(timelineRepository, times(1)).save(any(PostulacionTimeline.class));
    }

    @Test
    void updateCandidateStatusRejectsInvalidStatus() {
        assertThrows(ResponseStatusException.class,
                () -> service.updateCandidateStatus(10L, "estado_inexistente", null, "reclutador1@gmail.com"));
    }

    @Test
    void getCandidateTimelineReturnsEvents() {
        Postulacion p = new Postulacion("GTEL-2026-1111", postulante, vacante, "/api/candidate/cv/file.pdf", "file.pdf");
        p.setId(10L);

        PostulacionTimeline t1 = new PostulacionTimeline(p, null, "recibida", "Registro inicial", candidatoUser);
        t1.setId(100L);

        when(postulacionRepository.findById(10L)).thenReturn(Optional.of(p));
        when(timelineRepository.findByPostulacionIdOrderByFechaCambioAsc(10L)).thenReturn(List.of(t1));

        var timeline = service.getCandidateTimeline(10L);

        assertNotNull(timeline);
        assertEquals(1, timeline.size());
        assertEquals("recibida", timeline.get(0).get("newStatus"));
    }
}
