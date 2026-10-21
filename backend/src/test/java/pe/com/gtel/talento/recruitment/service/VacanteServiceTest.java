package pe.com.gtel.talento.recruitment.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;
import pe.com.gtel.talento.identity.entity.Rol;
import pe.com.gtel.talento.identity.entity.Usuario;
import pe.com.gtel.talento.identity.repository.UsuarioRepository;
import pe.com.gtel.talento.recruitment.dto.VacanteRequest;
import pe.com.gtel.talento.recruitment.dto.VacanteResponse;
import pe.com.gtel.talento.recruitment.entity.Departamento;
import pe.com.gtel.talento.recruitment.entity.Vacante;
import pe.com.gtel.talento.recruitment.repository.DepartamentoRepository;
import pe.com.gtel.talento.recruitment.repository.VacanteRepository;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VacanteServiceTest {

    @Mock
    private VacanteRepository vacanteRepository;

    @Mock
    private DepartamentoRepository departamentoRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private VacanteService vacanteService;

    private Departamento departamento;
    private Usuario reclutador;
    private Vacante vacante;

    @BeforeEach
    void setUp() {
        departamento = new Departamento(1L, "Ventas y Comercial", "Campañas de telecomunicaciones", "activo");
        reclutador = new Usuario("reclutador1@gmail.com", "hash", new Rol("RECLUTADOR", ""));
        vacante = new Vacante();
        vacante.setId(10L);
        vacante.setTitulo("Asesor Comercial");
        vacante.setDescripcion("Ventas outbound");
        vacante.setDepartamento(departamento);
        vacante.setReclutador(reclutador);
        vacante.setSueldoMin(new BigDecimal("1500"));
        vacante.setSueldoMax(new BigDecimal("2200"));
        vacante.setTipoJornada("full_time");
        vacante.setModalidad("presencial");
        vacante.setSede("Lima, Perú");
        vacante.setFechaPublicacion(LocalDateTime.now());
        vacante.setFechaLimitePostulacion(LocalDate.now().plusDays(30));
        vacante.setEstado("activa");
    }

    @Test
    void listPublicJobsReturnsMappedResponses() {
        when(vacanteRepository.searchPublicJobs(any(), any(), any(), any()))
                .thenReturn(List.of(vacante));

        List<VacanteResponse> result = vacanteService.listPublicJobs("Asesor", "full_time", null, "Lima");

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Asesor Comercial", result.get(0).getTitle());
        assertEquals("Ventas y Comercial", result.get(0).getDepartment());
        assertEquals("Full-Time", result.get(0).getType());
    }

    @Test
    void getPublicJobThrowsNotFoundWhenInactiveOrMissing() {
        when(vacanteRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () -> vacanteService.getPublicJob(99L));
    }

    @Test
    void createJobSavesAndReturnsResponse() {
        when(usuarioRepository.findByEmailIgnoreCase("reclutador1@gmail.com"))
                .thenReturn(Optional.of(reclutador));
        when(departamentoRepository.findById(1L))
                .thenReturn(Optional.of(departamento));
        when(vacanteRepository.save(any(Vacante.class)))
                .thenAnswer(inv -> {
                    Vacante v = inv.getArgument(0);
                    v.setId(20L);
                    return v;
                });

        VacanteRequest request = new VacanteRequest();
        request.setTitulo("Especialista TI");
        request.setDescripcion("Soporte a servidores");
        request.setDepartamentoId(1L);
        request.setSueldoMin(new BigDecimal("2000"));
        request.setSueldoMax(new BigDecimal("3000"));
        request.setTipoJornada("full_time");
        request.setModalidad("remoto");
        request.setSede("Remoto");

        VacanteResponse created = vacanteService.createJob(request, "reclutador1@gmail.com");

        assertNotNull(created);
        assertEquals("Especialista TI", created.getTitle());
        assertEquals("20", created.getId());
        verify(vacanteRepository, times(1)).save(any(Vacante.class));
    }

    @Test
    void changeJobStatusUpdatesStatusSuccessfully() {
        when(vacanteRepository.findById(10L)).thenReturn(Optional.of(vacante));
        when(vacanteRepository.save(any(Vacante.class))).thenAnswer(inv -> inv.getArgument(0));

        VacanteResponse updated = vacanteService.changeJobStatus(10L, "pausada", "reclutador1@gmail.com");

        assertNotNull(updated);
        assertEquals("pausada", updated.getStatus());
    }
}
