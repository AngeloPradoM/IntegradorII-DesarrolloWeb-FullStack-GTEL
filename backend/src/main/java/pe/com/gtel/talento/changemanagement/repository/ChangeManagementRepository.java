package pe.com.gtel.talento.changemanagement.repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import pe.com.gtel.talento.changemanagement.dto.ChangeCreateRequest;
import pe.com.gtel.talento.changemanagement.dto.ChangeDocumentPayload;
import pe.com.gtel.talento.changemanagement.dto.ChangeExecutionRequest;
import pe.com.gtel.talento.changemanagement.dto.ChangeResponse;
import pe.com.gtel.talento.changemanagement.dto.ChangeTechnicalReviewRequest;

@Repository
public class ChangeManagementRepository {
    private final JdbcTemplate jdbc;

    private static final String SELECT = """
        SELECT c.*,sol.email solicitante_email,res.email responsable_email,imp.email implementador_email,
               (SELECT d.nombre_original FROM solicitud_cambio_documentos d
                WHERE d.solicitud_cambio_id=c.id ORDER BY d.version DESC LIMIT 1) documento_nombre
        FROM solicitudes_cambio c
        JOIN usuarios sol ON sol.id=c.solicitante_id
        LEFT JOIN usuarios res ON res.id=c.responsable_id
        LEFT JOIN usuarios imp ON imp.id=c.implementador_id
        """;

    private final RowMapper<ChangeResponse> mapper = (rs, row) -> new ChangeResponse(
        rs.getLong("id"), rs.getString("codigo"), rs.getString("titulo"), rs.getString("tipo"),
        rs.getString("categoria"), rs.getString("prioridad"), rs.getString("impacto"),
        rs.getString("urgencia"), rs.getString("descripcion"), rs.getString("justificacion"),
        rs.getString("areas_afectadas"), rs.getString("estado"), rs.getLong("solicitante_id"),
        rs.getString("solicitante_email"), rs.getObject("responsable_id", Long.class),
        rs.getString("responsable_email"), rs.getObject("implementador_id", Long.class),
        rs.getString("implementador_email"), rs.getString("evaluacion_tecnica"),
        rs.getString("plan_implementacion"), rs.getString("plan_pruebas"), rs.getString("plan_retorno"),
        rs.getString("plan_comunicacion"), rs.getString("probabilidad_riesgo"),
        rs.getString("impacto_riesgo"), rs.getString("nivel_riesgo"), rs.getString("comentario_cab"),
        rs.getString("miembros_cab"), rs.getString("evidencia_ejecucion"), rs.getString("resultado"),
        rs.getString("lecciones_aprendidas"), rs.getString("comentario_validacion"),
        rs.getString("documento_nombre"), timestamp(rs, "created_at"), timestamp(rs, "updated_at"),
        timestamp(rs, "approved_at"), timestamp(rs, "implemented_at"), timestamp(rs, "closed_at"));

    public ChangeManagementRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    private static LocalDateTime timestamp(java.sql.ResultSet rs, String name) throws java.sql.SQLException {
        var value = rs.getTimestamp(name);
        return value == null ? null : value.toLocalDateTime();
    }

    public long create(long requesterId, ChangeCreateRequest request) {
        KeyHolder keys = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                INSERT INTO solicitudes_cambio(solicitante_id,titulo,tipo,categoria,prioridad,impacto,urgencia,
                    descripcion,justificacion,areas_afectadas,estado)
                VALUES(?,?,?,?,?,?,?,?,?,?,'REGISTRADO')
                """, Statement.RETURN_GENERATED_KEYS);
            statement.setLong(1, requesterId);
            statement.setString(2, request.title().trim());
            statement.setString(3, request.type());
            statement.setString(4, request.category());
            statement.setString(5, request.priority());
            statement.setString(6, request.impact());
            statement.setString(7, request.urgency());
            statement.setString(8, request.description().trim());
            statement.setString(9, request.justification().trim());
            statement.setString(10, request.affectedAreas().trim());
            return statement;
        }, keys);
        Number key = keys.getKey();
        if (key == null) throw new IllegalStateException("No se pudo generar la RFC");
        long id = key.longValue();
        jdbc.update("UPDATE solicitudes_cambio SET codigo=? WHERE id=?",
            "RFC-" + java.time.Year.now().getValue() + "-" + String.format("%04d", id), id);
        return id;
    }

    public void saveDocument(long id, long actorId, String name, String mimeType, byte[] content, String sha256) {
        jdbc.update("""
            INSERT INTO solicitud_cambio_documentos(solicitud_cambio_id,version,nombre_original,mime_type,tamano,sha256,contenido,cargado_por)
            VALUES(?,1,?,?,?,?,?,?)
            """, id, name, mimeType, content.length, sha256, content, actorId);
    }

    public List<ChangeResponse> listAll() { return jdbc.query(SELECT + " ORDER BY c.created_at DESC,c.id DESC", mapper); }
    public List<ChangeResponse> listForRequester(long id) { return jdbc.query(SELECT + " WHERE c.solicitante_id=? ORDER BY c.created_at DESC,c.id DESC", mapper, id); }
    public List<ChangeResponse> listForTechnician(long id) { return jdbc.query(SELECT + " WHERE c.responsable_id IS NULL OR c.responsable_id=? OR c.implementador_id=? ORDER BY c.created_at DESC,c.id DESC", mapper, id, id); }
    public ChangeResponse find(long id) { return jdbc.query(SELECT + " WHERE c.id=?", mapper, id).stream().findFirst().orElse(null); }

    public boolean isActiveTechnician(long id) {
        Long count = jdbc.queryForObject("""
            SELECT COUNT(*) FROM usuarios u JOIN roles r ON r.id=u.rol_id
            WHERE u.id=? AND u.estado='activo' AND r.nombre='TECNICO'
            """, Long.class, id);
        return count != null && count > 0;
    }

    public void assign(long id, long technicianId) {
        jdbc.update("UPDATE solicitudes_cambio SET responsable_id=?,implementador_id=?,estado='ASIGNADO',updated_at=CURRENT_TIMESTAMP WHERE id=?", technicianId, technicianId, id);
    }

    public void saveTechnicalReview(long id, ChangeTechnicalReviewRequest request) {
        jdbc.update("""
            UPDATE solicitudes_cambio SET evaluacion_tecnica=?,plan_implementacion=?,plan_pruebas=?,
                plan_retorno=?,plan_comunicacion=?,estado='PENDIENTE_APROBACION',updated_at=CURRENT_TIMESTAMP
            WHERE id=?
            """, request.technicalEvaluation().trim(), request.implementationPlan().trim(),
            request.testPlan().trim(), request.rollbackPlan().trim(), request.communicationPlan().trim(), id);
    }

    public void decide(long id, long actorId, boolean approved, String probability, String impact,
                       String riskLevel, String comment, String cabMembers) {
        jdbc.update("""
            UPDATE solicitudes_cambio SET probabilidad_riesgo=?,impacto_riesgo=?,nivel_riesgo=?,
                comentario_cab=?,miembros_cab=?,estado=?,approved_at=CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE NULL END,
                updated_at=CURRENT_TIMESTAMP WHERE id=?
            """, probability, impact, riskLevel, comment, cabMembers,
            approved ? "APROBADO" : "AJUSTES_SOLICITADOS", approved, id);
        jdbc.update("""
            INSERT INTO solicitud_cambio_aprobaciones(solicitud_cambio_id,actor_id,rol_aprobacion,decision,comentario)
            VALUES(?,?,'AUTORIDAD_CAMBIO',?,?)
            """, id, actorId, approved ? "APROBADO" : "AJUSTES", comment);
    }

    public void execute(long id, ChangeExecutionRequest request) {
        jdbc.update("""
            UPDATE solicitudes_cambio SET evidencia_ejecucion=?,resultado=?,lecciones_aprendidas=?,
                estado='EN_VALIDACION',implemented_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?
            """, request.evidence().trim(), request.result(), request.lessonsLearned().trim(), id);
    }

    public void validate(long id, boolean accepted, String comment) {
        jdbc.update("""
            UPDATE solicitudes_cambio SET comentario_validacion=?,estado=?,
                closed_at=CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE NULL END,updated_at=CURRENT_TIMESTAMP WHERE id=?
            """, comment, accepted ? "CERRADO" : "OBSERVADO", accepted, id);
    }

    public ChangeDocumentPayload document(long id) {
        return jdbc.query("""
            SELECT nombre_original,mime_type,contenido FROM solicitud_cambio_documentos
            WHERE solicitud_cambio_id=? ORDER BY version DESC LIMIT 1
            """, (rs, row) -> new ChangeDocumentPayload(rs.getString(1), rs.getString(2), rs.getBytes(3)), id)
            .stream().findFirst().orElse(null);
    }

    public void addHistory(long id, long actorId, String previous, String next, String detail) {
        jdbc.update("""
            INSERT INTO solicitud_cambio_historial(solicitud_cambio_id,actor_id,estado_anterior,estado_nuevo,detalle)
            VALUES(?,?,?,?,?)
            """, id, actorId, previous, next, detail);
    }
}
