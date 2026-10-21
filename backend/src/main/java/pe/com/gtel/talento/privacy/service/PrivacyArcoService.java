package pe.com.gtel.talento.privacy.service;

import java.time.LocalDateTime;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import pe.com.gtel.talento.identity.entity.Postulante;
import pe.com.gtel.talento.identity.entity.Usuario;
import pe.com.gtel.talento.identity.repository.PostulanteRepository;
import pe.com.gtel.talento.identity.repository.UsuarioRepository;
import pe.com.gtel.talento.privacy.dto.*;
import pe.com.gtel.talento.privacy.entity.SolicitudArco;
import pe.com.gtel.talento.privacy.repository.SolicitudArcoRepository;
import pe.com.gtel.talento.recruitment.entity.Entrevista;
import pe.com.gtel.talento.recruitment.entity.Evaluacion;
import pe.com.gtel.talento.recruitment.entity.Postulacion;
import pe.com.gtel.talento.recruitment.entity.PostulacionTimeline;
import pe.com.gtel.talento.recruitment.repository.EntrevistaRepository;
import pe.com.gtel.talento.recruitment.repository.EvaluacionRepository;
import pe.com.gtel.talento.recruitment.repository.PostulacionRepository;
import pe.com.gtel.talento.recruitment.service.CvStorageService;

@Service
public class PrivacyArcoService {

    private static final String BASE_LEGAL = "Ley N° 29733 de Protección de Datos Personales de la República del Perú y su Reglamento D.S. 003-2013-JUS";

    private final UsuarioRepository usuarioRepository;
    private final PostulanteRepository postulanteRepository;
    private final PostulacionRepository postulacionRepository;
    private final EntrevistaRepository entrevistaRepository;
    private final EvaluacionRepository evaluacionRepository;
    private final SolicitudArcoRepository solicitudArcoRepository;
    private final CvStorageService cvStorageService;

    public PrivacyArcoService(
            UsuarioRepository usuarioRepository,
            PostulanteRepository postulanteRepository,
            PostulacionRepository postulacionRepository,
            EntrevistaRepository entrevistaRepository,
            EvaluacionRepository evaluacionRepository,
            SolicitudArcoRepository solicitudArcoRepository,
            CvStorageService cvStorageService) {
        this.usuarioRepository = usuarioRepository;
        this.postulanteRepository = postulanteRepository;
        this.postulacionRepository = postulacionRepository;
        this.entrevistaRepository = entrevistaRepository;
        this.evaluacionRepository = evaluacionRepository;
        this.solicitudArcoRepository = solicitudArcoRepository;
        this.cvStorageService = cvStorageService;
    }

    /**
     * DERECHO DE ACCESO Y PORTABILIDAD (Art. 19 Ley 29733)
     * Exporta el legajo íntegro del titular en un formato JSON estructurado y auditable.
     */
    @Transactional
    public DataExportResponse exportCandidateData(String candidateEmail, String ipOrigen, String userAgent) {
        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(candidateEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        Postulante postulante = postulanteRepository.findByUsuarioEmailIgnoreCase(candidateEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Perfil de postulante no encontrado"));

        List<Postulacion> postulaciones = postulacionRepository.findByPostulanteIdOrderByFechaPostulacionDesc(postulante.getId());
        List<Entrevista> entrevistas = entrevistaRepository.findByPostulanteId(postulante.getId());
        List<Evaluacion> evaluaciones = evaluacionRepository.findByPostulanteId(postulante.getId());

        // Registrar solicitud ARCO de Acceso
        SolicitudArco auditoria = new SolicitudArco(
                usuario,
                candidateEmail,
                "ACCESO",
                "Exportación completa de legajo bajo derecho de portabilidad y acceso",
                ipOrigen,
                userAgent
        );
        solicitudArcoRepository.save(auditoria);

        var titularData = new DataExportResponse.TitularData(
                postulante.getId(),
                postulante.getNombres(),
                postulante.getApellidos(),
                postulante.getDni(),
                postulante.getTelefono(),
                usuario.getEmail(),
                postulante.getFechaNacimiento() != null ? postulante.getFechaNacimiento().toString() : null,
                postulante.getExperiencia(),
                postulante.getEducacion(),
                postulante.getEstado()
        );

        var consentimientoData = new DataExportResponse.ConsentimientoData(
                postulante.getConsentimientoDatos(),
                postulante.getFechaConsentimiento(),
                postulante.getConsentimientoVersion(),
                "Procesamiento de convocatorias laborales y evaluación de perfil profesional en GTEL Talento"
        );

        List<DataExportResponse.PostulacionData> postDataList = new ArrayList<>();
        List<DataExportResponse.TimelineData> timelineList = new ArrayList<>();

        for (Postulacion p : postulaciones) {
            String vacanteTitulo = p.getVacante() != null ? p.getVacante().getTitulo() : "No especificado";
            String vacanteArea = (p.getVacante() != null && p.getVacante().getDepartamento() != null)
                    ? p.getVacante().getDepartamento().getNombre()
                    : "General";

            postDataList.add(new DataExportResponse.PostulacionData(
                    p.getId(),
                    p.getCodigo(),
                    p.getVacante() != null ? p.getVacante().getId() : null,
                    vacanteTitulo,
                    vacanteArea,
                    p.getEstado(),
                    p.getPuntajeGeneral(),
                    p.getFechaPostulacion(),
                    p.getCvNombre()
            ));

            if (p.getTimeline() != null) {
                for (PostulacionTimeline pt : p.getTimeline()) {
                    timelineList.add(new DataExportResponse.TimelineData(
                            p.getId(),
                            p.getCodigo(),
                            pt.getEstadoAnterior(),
                            pt.getEstadoNuevo(),
                            pt.getFechaCambio(),
                            pt.getComentario()
                    ));
                }
            }
        }

        List<DataExportResponse.EntrevistaData> entList = new ArrayList<>();
        for (Entrevista e : entrevistas) {
            String codPost = (e.getPostulacion() != null) ? e.getPostulacion().getCodigo() : "-";
            String vacTit = (e.getPostulacion() != null && e.getPostulacion().getVacante() != null)
                    ? e.getPostulacion().getVacante().getTitulo()
                    : "-";
            LocalDateTime fechaHora = (e.getFecha() != null && e.getHora() != null)
                    ? LocalDateTime.of(e.getFecha(), e.getHora())
                    : null;

            entList.add(new DataExportResponse.EntrevistaData(
                    e.getId(),
                    codPost,
                    vacTit,
                    fechaHora,
                    e.getDuracionMin(),
                    e.getTipo(),
                    e.getUbicacion(),
                    e.getEstado()
            ));
        }

        List<DataExportResponse.EvaluacionData> evalList = new ArrayList<>();
        for (Evaluacion ev : evaluaciones) {
            List<Map<String, Object>> critList = new ArrayList<>();
            if (ev.getDetalles() != null) {
                for (var d : ev.getDetalles()) {
                    critList.add(Map.of(
                            "criterio", d.getCriterio(),
                            "peso", d.getPorcentaje() != null ? d.getPorcentaje() : 0,
                            "puntaje", d.getPuntaje()
                    ));
                }
            }
            LocalDateTime fechaEval = ev.getFechaEvaluacion() != null
                    ? ev.getFechaEvaluacion().atStartOfDay()
                    : null;
            evalList.add(new DataExportResponse.EvaluacionData(
                    ev.getId(),
                    ev.getTipoEvaluacion(),
                    ev.getPuntajeTotal(),
                    ev.getResultado(),
                    fechaEval,
                    critList
            ));
        }

        return new DataExportResponse(
                BASE_LEGAL,
                LocalDateTime.now(),
                titularData,
                consentimientoData,
                postDataList,
                entList,
                evalList,
                timelineList
        );
    }

    /**
     * DERECHO DE CANCELACIÓN Y AL OLVIDO (Art. 20 Ley 29733)
     * Anonimiza los datos personales, elimina físicamente los archivos de CV del almacenamiento
     * y marca la cuenta como 'anonimizado' manteniendo trazabilidad disociada.
     */
    @Transactional
    public AnonymizeResponse anonymizeCandidateAccount(String candidateEmail, AnonymizeRequest request, String ipOrigen, String userAgent) {
        if (request == null || !Boolean.TRUE.equals(request.getConfirmacion())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debes confirmar expresamente la supresión de datos.");
        }

        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(candidateEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        Postulante postulante = postulanteRepository.findByUsuarioEmailIgnoreCase(candidateEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Perfil de postulante no encontrado"));

        Long titularId = postulante.getId();
        Long usuarioId = usuario.getId();

        // 1. Borrar archivos físicos de CV de las postulaciones asociadas
        List<Postulacion> postulaciones = postulacionRepository.findByPostulanteIdOrderByFechaPostulacionDesc(titularId);
        int cvsBorrados = 0;
        for (Postulacion p : postulaciones) {
            if (p.getCvUrl() != null && !p.getCvUrl().isBlank()) {
                String filename = p.getCvUrl().replace("/api/candidate/cv/", "");
                if (cvStorageService.deleteCvFile(filename)) {
                    cvsBorrados++;
                }
                p.setCvUrl(null);
                p.setCvNombre("SUPRIMIDO_LEY_29733");
            }
            // Agregar hito en el timeline
            PostulacionTimeline timelineAnon = new PostulacionTimeline(
                    p,
                    p.getEstado(),
                    "anonimizada",
                    "Cancelación y anonimización de datos personales ejercida por el titular (Art. 20 Ley 29733).",
                    usuario
            );
            p.addTimelineEvent(timelineAnon);
            p.setEstado("rechazada"); // Cerrada/desactivada en el pipeline
        }
        postulacionRepository.saveAll(postulaciones);

        // 2. Anonimizar datos de Postulante
        postulante.setNombres("TITULAR_ANONIMIZADO");
        postulante.setApellidos("LEY_29733");
        postulante.setDni(null);
        postulante.setTelefono(null);
        postulante.setFechaNacimiento(null);
        postulante.setCvUrl(null);
        postulante.setExperiencia("Datos cancelados a solicitud del titular conforme al Art. 20 de la Ley N° 29733.");
        postulante.setEducacion(null);
        postulante.setEstado("anonimizado");
        postulante.setConsentimientoDatos(false);
        postulante.setConsentimientoVersion("REVOCADO_LEY_29733");
        postulanteRepository.save(postulante);

        // 3. Anonimizar cuenta de Usuario
        String anonEmail = String.format("anonimo_%d_%d@privacidad.gtel.pe", usuarioId, System.currentTimeMillis());
        usuario.setEmail(anonEmail);
        usuario.setPasswordHash("$2a$10$ANONIMIZADO_CUENTA_ELIMINADA_" + UUID.randomUUID());
        usuario.setEstado("anonimizado");
        usuarioRepository.save(usuario);

        // 4. Registrar auditoría ARCO
        String detalle = String.format("Cancelación total de datos personales y eliminación de %d archivo(s) de CV. Motivo indicado: %s",
                cvsBorrados,
                (request.getMotivo() != null && !request.getMotivo().isBlank()) ? request.getMotivo() : "Voluntad del titular");

        SolicitudArco auditoria = new SolicitudArco(
                usuario,
                candidateEmail,
                "CANCELACION_OLVIDO",
                detalle,
                ipOrigen,
                userAgent
        );
        auditoria = solicitudArcoRepository.save(auditoria);

        return new AnonymizeResponse(
                true,
                "Tus datos personales y currículums han sido cancelados y anonimizados permanentemente conforme a la Ley N° 29733.",
                BASE_LEGAL,
                LocalDateTime.now(),
                auditoria.getId()
        );
    }
}
