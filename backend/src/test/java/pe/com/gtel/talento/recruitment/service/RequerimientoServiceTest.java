package pe.com.gtel.talento.recruitment.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;
import pe.com.gtel.talento.identity.entity.Rol;
import pe.com.gtel.talento.identity.entity.Usuario;
import pe.com.gtel.talento.identity.repository.UsuarioRepository;
import pe.com.gtel.talento.recruitment.dto.RequerimientoRequest;
import pe.com.gtel.talento.recruitment.dto.RequerimientoResponse;
import pe.com.gtel.talento.recruitment.dto.RequerimientoStatusRequest;
import pe.com.gtel.talento.recruitment.entity.Departamento;
import pe.com.gtel.talento.recruitment.entity.RequerimientoPersonal;
import pe.com.gtel.talento.recruitment.repository.DepartamentoRepository;
import pe.com.gtel.talento.recruitment.repository.RequerimientoPersonalRepository;

@ExtendWith(MockitoExtension.class)
class RequerimientoServiceTest {

    @Mock
    private RequerimientoPersonalRepository repository;
    @Mock
    private DepartamentoRepository departamentoRepository;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private pe.com.gtel.talento.notification.service.NotificationService notificationService;

    private RequerimientoService service;

    @BeforeEach
    void setUp() {
        service = new RequerimientoService(repository, departamentoRepository, usuarioRepository, notificationService);
    }

    @Test
    @DisplayName("Listar para RECLUTADOR retorna todos los requerimientos")
    void shouldListAllForRecruiter() {
        Departamento dept = new Departamento();
        dept.setId(1L);
        dept.setNombre("IT");

        Usuario user = new Usuario("jefe@gtel.com", "hash", new Rol("JEFATURA_SOLICITANTE", ""));
        user.setId(10L);

        RequerimientoPersonal req = new RequerimientoPersonal(dept, user, "Desarrollador Java", "Exp 2 años", 2);
        req.setId(100L);

        when(repository.findAllByOrderByFechaSolicitudDesc()).thenReturn(List.of(req));

        List<RequerimientoResponse> result = service.listar("recruiter@gtel.com", "RECLUTADOR");

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Desarrollador Java", result.get(0).titulo());
        assertEquals("IT", result.get(0).departamentoNombre());
        verify(repository).findAllByOrderByFechaSolicitudDesc();
    }

    @Test
    @DisplayName("Listar para JEFATURA_SOLICITANTE filtra por su propio email")
    void shouldListOnlyOwnForJefatura() {
        Departamento dept = new Departamento();
        dept.setId(2L);
        dept.setNombre("Ventas");

        Usuario user = new Usuario("jefatura1@gmail.com", "hash", new Rol("JEFATURA_SOLICITANTE", ""));
        user.setId(4L);

        RequerimientoPersonal req = new RequerimientoPersonal(dept, user, "Asesor Outbound", "Ventas B2B", 3);
        req.setId(200L);

        when(repository.findBySolicitanteEmailIgnoreCaseOrderByFechaSolicitudDesc("jefatura1@gmail.com")).thenReturn(List.of(req));

        List<RequerimientoResponse> result = service.listar("jefatura1@gmail.com", "JEFATURA_SOLICITANTE");

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Asesor Outbound", result.get(0).titulo());
        verify(repository).findBySolicitanteEmailIgnoreCaseOrderByFechaSolicitudDesc("jefatura1@gmail.com");
    }

    @Test
    @DisplayName("Crear requerimiento asocia departamento y usuario con estado pendiente")
    void shouldCreateRequirement() {
        Departamento dept = new Departamento();
        dept.setId(3L);
        dept.setNombre("Soporte");

        Usuario solicitante = new Usuario("jefe@gtel.com", "hash", new Rol("JEFATURA_SOLICITANTE", ""));
        solicitante.setId(4L);

        when(usuarioRepository.findByEmailIgnoreCase("jefe@gtel.com")).thenReturn(Optional.of(solicitante));
        when(departamentoRepository.findById(3L)).thenReturn(Optional.of(dept));
        when(repository.save(any(RequerimientoPersonal.class))).thenAnswer(inv -> {
            RequerimientoPersonal saved = inv.getArgument(0);
            saved.setId(300L);
            return saved;
        });

        RequerimientoRequest request = new RequerimientoRequest(
                "Especialista Redes",
                3L,
                "Se requiere certificado CCNA",
                2,
                "Urgente para fibra óptica"
        );

        RequerimientoResponse response = service.crear(request, "jefe@gtel.com");

        assertNotNull(response);
        assertEquals(300L, response.id());
        assertEquals("Especialista Redes", response.titulo());
        assertEquals("pendiente", response.estado());
        assertEquals(2, response.cantidad());
        assertEquals("Urgente para fibra óptica", response.observaciones());
        verify(repository).save(any(RequerimientoPersonal.class));
    }

    @Test
    @DisplayName("Reclutador puede aprobar requerimiento")
    void shouldApproveRequirementWhenRecruiter() {
        Departamento dept = new Departamento();
        dept.setId(1L);
        Usuario user = new Usuario("jefe@gtel.com", "hash", new Rol("JEFATURA_SOLICITANTE", ""));

        RequerimientoPersonal req = new RequerimientoPersonal(dept, user, "Analista QA", "Pruebas", 1);
        req.setId(500L);
        req.setEstado("pendiente");

        when(repository.findById(500L)).thenReturn(Optional.of(req));
        when(repository.save(any(RequerimientoPersonal.class))).thenAnswer(i -> i.getArgument(0));

        RequerimientoStatusRequest statusRequest = new RequerimientoStatusRequest("aprobado", "Aprobado para publicar oferta");

        RequerimientoResponse response = service.cambiarEstado(500L, statusRequest, "reclutador1@gmail.com", "RECLUTADOR");

        assertNotNull(response);
        assertEquals("aprobado", response.estado());
        assertNotNull(response.fechaAprobacion());
        assertEquals("Aprobado para publicar oferta", response.observaciones());
    }

    @Test
    @DisplayName("Rol sin permisos no puede aprobar requerimiento (FORBIDDEN)")
    void shouldDenyApprovalForUnauthorizedRole() {
        RequerimientoStatusRequest statusRequest = new RequerimientoStatusRequest("aprobado", "Sin permisos");

        assertThrows(ResponseStatusException.class, () ->
                service.cambiarEstado(1L, statusRequest, "jefe@gtel.com", "JEFATURA_SOLICITANTE")
        );
    }
}
