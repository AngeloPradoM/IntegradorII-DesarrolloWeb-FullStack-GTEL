package pe.com.gtel.talento.recruitment.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import pe.com.gtel.talento.identity.entity.Usuario;
import pe.com.gtel.talento.identity.repository.UsuarioRepository;
import pe.com.gtel.talento.recruitment.dto.VacanteRequest;
import pe.com.gtel.talento.recruitment.dto.VacanteResponse;
import pe.com.gtel.talento.recruitment.entity.Departamento;
import pe.com.gtel.talento.recruitment.entity.Vacante;
import pe.com.gtel.talento.recruitment.repository.DepartamentoRepository;
import pe.com.gtel.talento.recruitment.repository.VacanteRepository;

@Service
@Transactional
public class VacanteService {

    private final VacanteRepository vacanteRepository;
    private final DepartamentoRepository departamentoRepository;
    private final UsuarioRepository usuarioRepository;
    private final JdbcTemplate jdbcTemplate;

    public VacanteService(
            VacanteRepository vacanteRepository,
            DepartamentoRepository departamentoRepository,
            UsuarioRepository usuarioRepository,
            JdbcTemplate jdbcTemplate) {
        this.vacanteRepository = vacanteRepository;
        this.departamentoRepository = departamentoRepository;
        this.usuarioRepository = usuarioRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(readOnly = true)
    public List<VacanteResponse> listPublicJobs(String search, String type, String modality, String location) {
        String normalizedType = normalizeTipoJornadaFilter(type);
        String normalizedModality = normalizeModalidadFilter(modality);
        String searchTrimmed = (search != null && !search.isBlank()) ? search.trim() : null;
        String locationTrimmed = (location != null && !location.isBlank() && !"all".equalsIgnoreCase(location)) ? location.trim() : null;

        List<Vacante> vacantes = vacanteRepository.searchPublicJobs(
                searchTrimmed,
                normalizedType,
                normalizedModality,
                locationTrimmed
        );

        Map<Long, Integer> counts = getApplicantsCountMap();
        return vacantes.stream()
                .map(v -> VacanteResponse.fromEntity(v, counts.getOrDefault(v.getId(), 0)))
                .toList();
    }

    @Transactional(readOnly = true)
    public VacanteResponse getPublicJob(Long id) {
        Vacante vacante = vacanteRepository.findById(id)
                .filter(v -> "activa".equalsIgnoreCase(v.getEstado()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Oferta laboral no encontrada o inactiva."));
        int applicants = getApplicantsCount(id);
        return VacanteResponse.fromEntity(vacante, applicants);
    }

    @Transactional(readOnly = true)
    public List<VacanteResponse> listRecruiterJobs(String search, String status) {
        List<Vacante> vacantes = vacanteRepository.findAllByOrderByFechaPublicacionDesc();
        Map<Long, Integer> counts = getApplicantsCountMap();

        return vacantes.stream()
                .filter(v -> {
                    if (status != null && !status.isBlank() && !"all".equalsIgnoreCase(status)) {
                        if (!status.equalsIgnoreCase(v.getEstado())) return false;
                    }
                    if (search != null && !search.isBlank()) {
                        String q = search.trim().toLowerCase();
                        String title = v.getTitulo() != null ? v.getTitulo().toLowerCase() : "";
                        String loc = v.getSede() != null ? v.getSede().toLowerCase() : "";
                        String dept = v.getDepartamento() != null ? v.getDepartamento().getNombre().toLowerCase() : "";
                        return title.contains(q) || loc.contains(q) || dept.contains(q);
                    }
                    return true;
                })
                .map(v -> VacanteResponse.fromEntity(v, counts.getOrDefault(v.getId(), 0)))
                .toList();
    }

    @Transactional(readOnly = true)
    public VacanteResponse getRecruiterJob(Long id) {
        Vacante vacante = vacanteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Oferta laboral no encontrada."));
        int applicants = getApplicantsCount(id);
        return VacanteResponse.fromEntity(vacante, applicants);
    }

    public VacanteResponse createJob(VacanteRequest request, String recruiterEmail) {
        Usuario recruiter = usuarioRepository.findByEmailIgnoreCase(recruiterEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario reclutador no encontrado."));

        Departamento departamento = resolveDepartamento(request.getDepartamentoId(), request.getDepartamento());

        Vacante vacante = new Vacante();
        applyRequestToEntity(request, vacante);
        vacante.setDepartamento(departamento);
        vacante.setReclutador(recruiter);
        vacante.setFechaPublicacion(LocalDateTime.now());
        if (vacante.getEstado() == null || vacante.getEstado().isBlank()) {
            vacante.setEstado("activa");
        }

        Vacante saved = vacanteRepository.save(vacante);
        return VacanteResponse.fromEntity(saved, 0);
    }

    public VacanteResponse updateJob(Long id, VacanteRequest request, String recruiterEmail) {
        Vacante vacante = vacanteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Oferta laboral no encontrada."));

        if (request.getDepartamentoId() != null || (request.getDepartamento() != null && !request.getDepartamento().isBlank())) {
            Departamento departamento = resolveDepartamento(request.getDepartamentoId(), request.getDepartamento());
            vacante.setDepartamento(departamento);
        }

        applyRequestToEntity(request, vacante);
        Vacante updated = vacanteRepository.save(vacante);
        int applicants = getApplicantsCount(id);
        return VacanteResponse.fromEntity(updated, applicants);
    }

    public VacanteResponse changeJobStatus(Long id, String newStatus, String recruiterEmail) {
        Vacante vacante = vacanteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Oferta laboral no encontrada."));

        String normalized = switch (newStatus != null ? newStatus.toLowerCase().trim() : "") {
            case "activa", "activo", "active" -> "activa";
            case "pausada", "pausado", "paused" -> "pausada";
            case "cerrada", "cerrado", "closed" -> "cerrada";
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado inválido. Opciones: activa, pausada, cerrada.");
        };

        vacante.setEstado(normalized);
        if ("cerrada".equals(normalized)) {
            vacante.setFechaCierre(LocalDate.now());
        }
        Vacante updated = vacanteRepository.save(vacante);
        int applicants = getApplicantsCount(id);
        return VacanteResponse.fromEntity(updated, applicants);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listDepartments() {
        return departamentoRepository.findByEstadoOrderByIdAsc("activo").stream()
                .map(d -> Map.<String, Object>of(
                        "id", d.getId(),
                        "name", d.getNombre(),
                        "nombre", d.getNombre(),
                        "description", d.getDescripcion() != null ? d.getDescripcion() : ""
                ))
                .toList();
    }

    private Departamento resolveDepartamento(Long departmentId, String departmentName) {
        if (departmentId != null) {
            return departamentoRepository.findById(departmentId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "El departamento especificado no existe."));
        }
        if (departmentName != null && !departmentName.isBlank()) {
            String trimmed = departmentName.trim();
            return departamentoRepository.findByNombreIgnoreCase(trimmed)
                    .or(() -> departamentoRepository.findAll().stream()
                            .filter(d -> d.getNombre().toLowerCase().contains(trimmed.toLowerCase())
                                    || trimmed.toLowerCase().contains(d.getNombre().toLowerCase()))
                            .findFirst())
                    .orElseGet(() -> departamentoRepository.findById(1L)
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Departamento no disponible.")));
        }
        return departamentoRepository.findById(1L)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Departamento no disponible."));
    }

    private void applyRequestToEntity(VacanteRequest req, Vacante entity) {
        if (req.getTitulo() != null) entity.setTitulo(req.getTitulo().trim());
        if (req.getDescripcion() != null) entity.setDescripcion(req.getDescripcion().trim());
        if (req.getNumVacantes() != null && req.getNumVacantes() > 0) entity.setNumVacantes(req.getNumVacantes());
        if (req.getSueldoMin() != null) entity.setSueldoMin(req.getSueldoMin());
        if (req.getSueldoMax() != null) entity.setSueldoMax(req.getSueldoMax());
        if (req.getSede() != null) entity.setSede(req.getSede().trim());
        if (req.getFechaLimitePostulacion() != null) entity.setFechaLimitePostulacion(req.getFechaLimitePostulacion());
        if (req.getNivelEducativo() != null) entity.setNivelEducativo(req.getNivelEducativo().trim());
        if (req.getExperienciaMinima() != null) entity.setExperienciaMinima(req.getExperienciaMinima().trim());
        if (req.getHabilidades() != null) entity.setHabilidades(req.resolveHabilidadesString());
        if (req.getTipoJornada() != null) entity.setTipoJornada(normalizeTipoJornada(req.getTipoJornada()));
        if (req.getModalidad() != null) entity.setModalidad(normalizeModalidad(req.getModalidad()));
        if (req.getEstado() != null && !req.getEstado().isBlank()) {
            entity.setEstado(req.getEstado().toLowerCase().trim());
        }
    }

    private String normalizeTipoJornada(String raw) {
        if (raw == null) return "full_time";
        return switch (raw.toLowerCase().trim()) {
            case "part-time", "part_time", "medio tiempo" -> "part_time";
            case "por turnos", "por_turnos", "turnos" -> "por_turnos";
            case "freelance" -> "freelance";
            default -> "full_time";
        };
    }

    private String normalizeModalidad(String raw) {
        if (raw == null) return "presencial";
        return switch (raw.toLowerCase().trim()) {
            case "remoto", "remote" -> "remoto";
            case "hibrido", "híbrido", "hybrid" -> "hibrido";
            default -> "presencial";
        };
    }

    private String normalizeTipoJornadaFilter(String raw) {
        if (raw == null || raw.isBlank() || "all".equalsIgnoreCase(raw)) return null;
        return normalizeTipoJornada(raw);
    }

    private String normalizeModalidadFilter(String raw) {
        if (raw == null || raw.isBlank() || "all".equalsIgnoreCase(raw)) return null;
        return normalizeModalidad(raw);
    }

    private int getApplicantsCount(Long vacanteId) {
        try {
            Number count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM postulaciones WHERE vacante_id = ?",
                    Number.class,
                    vacanteId
            );
            return count != null ? count.intValue() : 0;
        } catch (Exception e) {
            return 0;
        }
    }

    private Map<Long, Integer> getApplicantsCountMap() {
        Map<Long, Integer> map = new HashMap<>();
        try {
            jdbcTemplate.query(
                    "SELECT vacante_id, COUNT(*) AS total FROM postulaciones GROUP BY vacante_id",
                    rs -> {
                        map.put(rs.getLong("vacante_id"), rs.getInt("total"));
                    }
            );
        } catch (Exception ignored) {}
        return map;
    }
}
