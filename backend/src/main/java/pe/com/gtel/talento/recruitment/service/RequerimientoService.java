package pe.com.gtel.talento.recruitment.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import pe.com.gtel.talento.identity.entity.Usuario;
import pe.com.gtel.talento.identity.repository.UsuarioRepository;
import pe.com.gtel.talento.recruitment.dto.RequerimientoRequest;
import pe.com.gtel.talento.recruitment.dto.RequerimientoResponse;
import pe.com.gtel.talento.recruitment.dto.RequerimientoStatusRequest;
import pe.com.gtel.talento.recruitment.entity.Departamento;
import pe.com.gtel.talento.recruitment.entity.RequerimientoPersonal;
import pe.com.gtel.talento.recruitment.repository.DepartamentoRepository;
import pe.com.gtel.talento.recruitment.repository.RequerimientoPersonalRepository;

@Service
@Transactional
public class RequerimientoService {

    private final RequerimientoPersonalRepository repository;
    private final DepartamentoRepository departamentoRepository;
    private final UsuarioRepository usuarioRepository;
    private final pe.com.gtel.talento.notification.service.NotificationService notificationService;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    public RequerimientoService(
            RequerimientoPersonalRepository repository,
            DepartamentoRepository departamentoRepository,
            UsuarioRepository usuarioRepository,
            pe.com.gtel.talento.notification.service.NotificationService notificationService) {
        this.repository = repository;
        this.departamentoRepository = departamentoRepository;
        this.usuarioRepository = usuarioRepository;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<RequerimientoResponse> listar(String userEmail, String userRole) {
        List<RequerimientoPersonal> list;
        if ("JEFATURA_SOLICITANTE".equalsIgnoreCase(userRole)) {
            list = repository.findBySolicitanteEmailIgnoreCaseOrderByFechaSolicitudDesc(userEmail);
        } else {
            list = repository.findAllByOrderByFechaSolicitudDesc();
        }
        return list.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public RequerimientoResponse obtenerPorId(Long id) {
        RequerimientoPersonal r = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Requerimiento de personal no encontrado"));
        return toResponse(r);
    }

    public RequerimientoResponse crear(RequerimientoRequest request, String userEmail) {
        Usuario solicitante = usuarioRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));

        Departamento departamento = departamentoRepository.findById(request.departamentoId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "El departamento especificado no existe"));

        RequerimientoPersonal r = new RequerimientoPersonal(
                departamento,
                solicitante,
                request.titulo().trim(),
                request.descripcion().trim(),
                request.cantidad()
        );

        if (request.observaciones() != null && !request.observaciones().isBlank()) {
            r.setObservaciones(request.observaciones().trim());
        }

        r = repository.save(r);

        try {
            if (notificationService != null) {
                notificationService.notifyUsersWithRoles(
                        java.util.List.of("RECLUTADOR", "ADMIN", "ANALISTA_RRHH"),
                        "Nuevo requerimiento de personal",
                        "Se solicitó personal para el puesto: \"" + r.getTitulo() + "\" (" + r.getCantidad() + " vacante/s).",
                        "REQUERIMIENTO_ESTADO",
                        "/reclutador/requerimientos"
                );
            }
        } catch (Exception ignored) {}

        return toResponse(r);
    }

    public RequerimientoResponse cambiarEstado(Long id, RequerimientoStatusRequest request, String userEmail, String userRole) {
        if (!"RECLUTADOR".equalsIgnoreCase(userRole) && !"ADMIN".equalsIgnoreCase(userRole)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo reclutadores o administradores pueden cambiar el estado de un requerimiento");
        }

        RequerimientoPersonal r = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Requerimiento de personal no encontrado"));

        String nuevoEstado = request.estado().toLowerCase();
        r.setEstado(nuevoEstado);

        if ("aprobado".equals(nuevoEstado)) {
            r.setFechaAprobacion(LocalDateTime.now());
        } else if ("pendiente".equals(nuevoEstado)) {
            r.setFechaAprobacion(null);
        }

        if (request.observaciones() != null && !request.observaciones().isBlank()) {
            r.setObservaciones(request.observaciones().trim());
        }

        r = repository.save(r);

        try {
            if (notificationService != null && r.getSolicitante() != null) {
                String estadoTxt = "aprobado".equalsIgnoreCase(nuevoEstado) ? "Aprobado" : ("rechazado".equalsIgnoreCase(nuevoEstado) ? "Rechazado" : "Actualizado");
                notificationService.notifyUser(
                        r.getSolicitante().getId(),
                        "Requerimiento " + estadoTxt,
                        "Tu solicitud para \"" + r.getTitulo() + "\" fue " + nuevoEstado + (r.getObservaciones() != null ? ": " + r.getObservaciones() : "."),
                        "REQUERIMIENTO_ESTADO",
                        "/reclutador/requerimientos"
                );
            }
        } catch (Exception ignored) {}

        return toResponse(r);
    }

    private RequerimientoResponse toResponse(RequerimientoPersonal r) {
        String fechaSolicitud = r.getFechaSolicitud() != null ? r.getFechaSolicitud().format(DATE_FORMATTER) : "";
        String fechaAprobacion = r.getFechaAprobacion() != null ? r.getFechaAprobacion().format(DATE_FORMATTER) : null;
        String deptoNombre = r.getDepartamento() != null ? r.getDepartamento().getNombre() : "General";
        Long deptoId = r.getDepartamento() != null ? r.getDepartamento().getId() : null;
        Long solId = r.getSolicitante() != null ? r.getSolicitante().getId() : null;
        String solEmail = r.getSolicitante() != null ? r.getSolicitante().getEmail() : "";

        return new RequerimientoResponse(
                r.getId(),
                r.getTitulo(),
                deptoId,
                deptoNombre,
                solId,
                solEmail,
                r.getCantidad(),
                r.getEstado(),
                fechaSolicitud,
                fechaAprobacion,
                r.getDescripcion(),
                r.getObservaciones()
        );
    }
}
