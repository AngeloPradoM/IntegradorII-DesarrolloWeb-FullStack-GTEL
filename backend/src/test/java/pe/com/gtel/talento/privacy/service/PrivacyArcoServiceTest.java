package pe.com.gtel.talento.privacy.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import pe.com.gtel.talento.identity.entity.Postulante;
import pe.com.gtel.talento.identity.entity.Rol;
import pe.com.gtel.talento.identity.entity.Usuario;
import pe.com.gtel.talento.identity.repository.PostulanteRepository;
import pe.com.gtel.talento.identity.repository.UsuarioRepository;
import pe.com.gtel.talento.privacy.dto.AnonymizeRequest;
import pe.com.gtel.talento.privacy.dto.AnonymizeResponse;
import pe.com.gtel.talento.privacy.dto.DataExportResponse;
import pe.com.gtel.talento.privacy.entity.SolicitudArco;
import pe.com.gtel.talento.privacy.repository.SolicitudArcoRepository;
import pe.com.gtel.talento.recruitment.entity.*;
import pe.com.gtel.talento.recruitment.repository.EntrevistaRepository;
import pe.com.gtel.talento.recruitment.repository.EvaluacionRepository;
import pe.com.gtel.talento.recruitment.repository.PostulacionRepository;
import pe.com.gtel.talento.recruitment.service.CvStorageService;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class PrivacyArcoServiceTest {

    private UsuarioRepository usuarioRepository;
    private PostulanteRepository postulanteRepository;
    private PostulacionRepository postulacionRepository;
    private EntrevistaRepository entrevistaRepository;
    private EvaluacionRepository evaluacionRepository;
    private SolicitudArcoRepository solicitudArcoRepository;
    private CvStorageService cvStorageService;

    private PrivacyArcoService privacyArcoService;

    private Usuario testUser;
    private Postulante testPostulante;
    private Postulacion testPostulacion;

    @BeforeEach
    void setUp() {
        usuarioRepository = mock(UsuarioRepository.class);
        postulanteRepository = mock(PostulanteRepository.class);
        postulacionRepository = mock(PostulacionRepository.class);
        entrevistaRepository = mock(EntrevistaRepository.class);
        evaluacionRepository = mock(EvaluacionRepository.class);
        solicitudArcoRepository = mock(SolicitudArcoRepository.class);
        cvStorageService = mock(CvStorageService.class);

        privacyArcoService = new PrivacyArcoService(
                usuarioRepository,
                postulanteRepository,
                postulacionRepository,
                entrevistaRepository,
                evaluacionRepository,
                solicitudArcoRepository,
                cvStorageService
        );

        Rol rol = new Rol("CANDIDATO", "Postulante");

        testUser = new Usuario("postulante.test@gmail.com", "hash123", rol);
        testUser.setId(10L);

        testPostulante = new Postulante(testUser, "Carlos", "Mendoza");
        testPostulante.setId(20L);
        testPostulante.setDni("76543210");
        testPostulante.setTelefono("+51999888777");
        testPostulante.setCvUrl("/api/candidate/cv/cv_test_123.pdf");

        Vacante vacante = new Vacante();
        vacante.setId(5L);
        vacante.setTitulo("Desarrollador Java Spring");

        testPostulacion = new Postulacion("GTEL-2026-TEST", testPostulante, vacante, "/api/candidate/cv/cv_test_123.pdf", "mi_cv.pdf");
        testPostulacion.setId(100L);
    }

    @Test
    void exportCandidateDataReturnsCompleteDossierAndRecordsArcoAudit() {
        when(usuarioRepository.findByEmailIgnoreCase("postulante.test@gmail.com")).thenReturn(Optional.of(testUser));
        when(postulanteRepository.findByUsuarioEmailIgnoreCase("postulante.test@gmail.com")).thenReturn(Optional.of(testPostulante));
        when(postulacionRepository.findByPostulanteIdOrderByFechaPostulacionDesc(20L)).thenReturn(List.of(testPostulacion));

        Entrevista entrevista = new Entrevista(testPostulacion, LocalDate.now(), LocalTime.of(10, 0), 45, "video", "https://teams.microsoft.com/meet/test");
        entrevista.setId(50L);
        when(entrevistaRepository.findByPostulanteId(20L)).thenReturn(List.of(entrevista));

        Evaluacion evaluacion = new Evaluacion(testPostulacion, "Técnica", 85, 60, "aprobado", testUser);
        evaluacion.setId(60L);
        when(evaluacionRepository.findByPostulanteId(20L)).thenReturn(List.of(evaluacion));

        DataExportResponse response = privacyArcoService.exportCandidateData("postulante.test@gmail.com", "127.0.0.1", "Mozilla/5.0");

        assertNotNull(response);
        assertTrue(response.baseLegal().contains("Ley N° 29733"));
        assertEquals("Carlos", response.titular().nombres());
        assertEquals("76543210", response.titular().dni());
        assertEquals(1, response.postulaciones().size());
        assertEquals("GTEL-2026-TEST", response.postulaciones().get(0).codigo());
        assertEquals(1, response.entrevistas().size());
        assertEquals(1, response.evaluaciones().size());

        verify(solicitudArcoRepository, times(1)).save(any(SolicitudArco.class));
    }

    @Test
    void anonymizeCandidateAccountDeletesPhysicalCvAndAnonymizesDossier() {
        when(usuarioRepository.findByEmailIgnoreCase("postulante.test@gmail.com")).thenReturn(Optional.of(testUser));
        when(postulanteRepository.findByUsuarioEmailIgnoreCase("postulante.test@gmail.com")).thenReturn(Optional.of(testPostulante));
        when(postulacionRepository.findByPostulanteIdOrderByFechaPostulacionDesc(20L)).thenReturn(List.of(testPostulacion));
        when(cvStorageService.deleteCvFile(anyString())).thenReturn(true);

        SolicitudArco savedAudit = new SolicitudArco(testUser, "postulante.test@gmail.com", "CANCELACION_OLVIDO", "Ok", "127.0.0.1", "agent");
        when(solicitudArcoRepository.save(any(SolicitudArco.class))).thenReturn(savedAudit);

        AnonymizeRequest req = new AnonymizeRequest(true, "Ya no deseo participar en procesos");
        AnonymizeResponse response = privacyArcoService.anonymizeCandidateAccount("postulante.test@gmail.com", req, "127.0.0.1", "Agent");

        assertTrue(response.exito());
        assertTrue(response.baseLegal().contains("Ley N° 29733"));

        // Verificar que el CV físico fue eliminado
        verify(cvStorageService, times(1)).deleteCvFile("cv_test_123.pdf");

        // Verificar que el postulante quedó anonimizado
        ArgumentCaptor<Postulante> postCaptor = ArgumentCaptor.forClass(Postulante.class);
        verify(postulanteRepository).save(postCaptor.capture());
        assertEquals("TITULAR_ANONIMIZADO", postCaptor.getValue().getNombres());
        assertEquals("anonimizado", postCaptor.getValue().getEstado());
        assertNull(postCaptor.getValue().getDni());
        assertNull(postCaptor.getValue().getTelefono());

        // Verificar que el usuario quedó anonimizado
        ArgumentCaptor<Usuario> userCaptor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(userCaptor.capture());
        assertEquals("anonimizado", userCaptor.getValue().getEstado());
        assertTrue(userCaptor.getValue().getEmail().contains("@privacidad.gtel.pe"));

        verify(solicitudArcoRepository, times(1)).save(any(SolicitudArco.class));
    }
}
