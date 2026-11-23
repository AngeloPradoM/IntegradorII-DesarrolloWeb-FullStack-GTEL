package pe.com.gtel.talento.incident.repository;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import pe.com.gtel.talento.incident.dto.IncidentActivityResponse;
import pe.com.gtel.talento.incident.dto.IncidentCreateRequest;
import pe.com.gtel.talento.incident.dto.IncidentEscalationResponse;
import pe.com.gtel.talento.incident.dto.IncidentHistoryResponse;
import pe.com.gtel.talento.incident.dto.IncidentLinkedSummary;
import pe.com.gtel.talento.incident.dto.IncidentResponse;

@Repository
public class ProductionIncidentRepository {
    private static final String SELECT = """
        SELECT i.*,rep.email reportante_email,res.email responsable_email,ver.email verificador_email,
          EXISTS(SELECT 1 FROM incidente_escalamientos ie
                 WHERE ie.incidente_id=i.id AND ie.resuelto_at IS NULL) escalado_activo
        FROM incidentes_produccion i
        LEFT JOIN usuarios rep ON rep.id=i.reportado_por
        LEFT JOIN usuarios res ON res.id=i.responsable_id
        LEFT JOIN usuarios ver ON ver.id=i.verificado_por
        """;

    private final JdbcTemplate jdbc;
    private final RowMapper<IncidentResponse> mapper = (rs, row) -> {
        String status = rs.getString("estado");
        boolean escalated = rs.getBoolean("escalado_activo");
        return new IncidentResponse(
            rs.getLong("id"), rs.getString("codigo"), rs.getString("titulo"), rs.getString("componente"),
            rs.getString("tipo"), rs.getString("fuente"), rs.getString("modulo_codigo"),
            rs.getString("categoria_sugerida"), rs.getString("categoria_codigo"),
            rs.getString("categoria_motivo"), rs.getString("descripcion"), rs.getString("alcance"),
            rs.getString("impacto"), rs.getString("urgencia"), rs.getBoolean("proceso_esencial"),
            rs.getBoolean("alternativa_disponible"), rs.getBoolean("servicio_bloqueado"),
            rs.getString("prioridad_sugerida"), rs.getString("prioridad"), status,
            displayStatus(status, escalated), escalated, rs.getObject("reportado_por", Long.class),
            rs.getString("reportante_email"), rs.getObject("responsable_id", Long.class),
            rs.getString("responsable_email"), rs.getString("asignacion_fuente"),
            rs.getObject("regla_asignacion_id", Long.class), timestamp(rs, "asignado_at"),
            rs.getObject("verificado_por", Long.class), rs.getString("verificador_email"),
            timestamp(rs, "detectado_at"), timestamp(rs, "iniciado_at"),
            timestamp(rs, "primera_atencion_at"), timestamp(rs, "recuperado_at"),
            timestamp(rs, "verificado_at"), timestamp(rs, "cerrado_at"),
            rs.getString("solucion_aplicada"), rs.getString("causa_raiz"), rs.getString("aprendizaje"),
            rs.getBoolean("falla_repetida"), rs.getObject("incidente_previo_id", Long.class),
            timestamp(rs, "sla_primera_atencion_at"), timestamp(rs, "sla_resolucion_at"),
            rs.getInt("version"), timestamp(rs, "created_at"), timestamp(rs, "updated_at"));
    };

    public ProductionIncidentRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public long create(long actorId, IncidentCreateRequest request, String suggestedPriority,
                       String suggestedCategory, String deduplicationKey) {
        KeyHolder keys = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                INSERT INTO incidentes_produccion(titulo,componente,tipo,modulo_codigo,categoria_sugerida,categoria_codigo,incidente_tipo_codigo,
                    fuente,descripcion,alcance,impacto,urgencia,proceso_esencial,alternativa_disponible,
                    servicio_bloqueado,prioridad_sugerida,estado,reportado_por,detectado_at,iniciado_at,
                    recuperado_at,falla_repetida,incidente_previo_id,clave_deduplicacion)
                VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'REGISTRADO',?,?,?,?,?,?,?)
                """, Statement.RETURN_GENERATED_KEYS);
            statement.setString(1, request.title().trim());
            statement.setString(2, request.component().trim());
            statement.setString(3, request.type().trim());
            statement.setString(4, normalized(request.moduleCode()));
            statement.setString(5, suggestedCategory);
            statement.setString(6, suggestedCategory);
            statement.setString(7, normalized(request.incidentTypeCode()));
            statement.setString(8, normalized(request.source()) == null ? "MANUAL" : request.source());
            statement.setString(9, request.description().trim());
            statement.setString(10, request.scope());
            statement.setString(11, request.impact());
            statement.setString(12, request.urgency());
            statement.setBoolean(13, request.essentialProcess());
            statement.setBoolean(14, request.workaroundAvailable());
            statement.setBoolean(15, request.serviceBlocked());
            statement.setString(16, suggestedPriority);
            statement.setLong(17, actorId);
            statement.setObject(18, request.detectedAt());
            statement.setObject(19, request.startedAt());
            statement.setObject(20, request.recoveredAt());
            statement.setBoolean(21, request.repeatedFailure());
            statement.setObject(22, request.previousIncidentId());
            statement.setString(23, deduplicationKey);
            return statement;
        }, keys);
        Number key = keys.getKey();
        if (key == null) throw new IllegalStateException("No se pudo generar el incidente");
        long id = key.longValue();
        jdbc.update("UPDATE incidentes_produccion SET codigo=? WHERE id=?",
            "INC-" + Year.now().getValue() + "-" + String.format("%05d", id), id);
        return id;
    }

    public List<IncidentResponse> listAll() {
        return jdbc.query(SELECT + " ORDER BY i.detectado_at DESC,i.id DESC", mapper);
    }

    public List<IncidentResponse> listForTechnician(long technicianId) {
        return jdbc.query(SELECT + " WHERE i.responsable_id IS NULL OR i.responsable_id=? ORDER BY i.detectado_at DESC,i.id DESC", mapper, technicianId);
    }

    public List<IncidentResponse> listForReporter(long reporterId) {
        return jdbc.query(SELECT + " WHERE i.reportado_por=? ORDER BY i.detectado_at DESC,i.id DESC", mapper, reporterId);
    }

    public IncidentResponse find(long id) {
        return jdbc.query(SELECT + " WHERE i.id=?", mapper, id).stream().findFirst().orElse(null);
    }

    public IncidentResponse findActivePotentialDuplicate(String component, String type) {
        return jdbc.query(SELECT + """
            WHERE i.estado<>'CERRADO' AND LOWER(TRIM(i.componente))=LOWER(TRIM(?))
              AND LOWER(TRIM(i.tipo))=LOWER(TRIM(?))
            ORDER BY i.detectado_at DESC,i.id DESC LIMIT 1
            """, mapper, component, type).stream().findFirst().orElse(null);
    }

    public boolean technicianCanView(long incidentId, long technicianId) {
        Long count = jdbc.queryForObject("SELECT COUNT(*) FROM incidentes_produccion WHERE id=? AND (responsable_id IS NULL OR responsable_id=?)", Long.class, incidentId, technicianId);
        return count != null && count > 0;
    }

    public List<IncidentLinkedSummary> listLinkedForRequester(long requesterId) {
        return jdbc.query("""
            SELECT i.id,i.codigo,i.titulo,i.componente,i.prioridad,i.estado
            FROM incidentes_produccion i
            WHERE EXISTS (
                SELECT 1
                FROM incidente_ticket it
                JOIN tickets_soporte t ON t.id=it.ticket_id
                WHERE it.incidente_id=i.id AND t.solicitante_id=?
            )
            ORDER BY i.detectado_at DESC,i.id DESC
            """, (rs, row) -> new IncidentLinkedSummary(rs.getLong(1), rs.getString(2), rs.getString(3),
                rs.getString(4), rs.getString(5), rs.getString(6)), requesterId);
    }

    public boolean isActiveTechnician(long id) {
        Long count = jdbc.queryForObject("""
            SELECT COUNT(*) FROM usuarios u JOIN roles r ON r.id=u.rol_id
            WHERE u.id=? AND u.estado='activo' AND r.nombre='TECNICO'
            """, Long.class, id);
        return count != null && count > 0;
    }

    public int classify(long id, String priority, String categoryCode, String categoryReason, long slaPolicyId,
                        LocalDateTime firstAttentionDeadline, LocalDateTime resolutionDeadline,
                        int expectedVersion) {
        return jdbc.update("""
            UPDATE incidentes_produccion SET prioridad=?,categoria_codigo=?,categoria_motivo=?,
              sla_politica_id=?,sla_primera_atencion_at=?,sla_resolucion_at=?,estado='CLASIFICADO',
              version=version+1,updated_at=CURRENT_TIMESTAMP
            WHERE id=? AND estado='REGISTRADO' AND version=?
            """, priority, categoryCode, categoryReason, slaPolicyId, firstAttentionDeadline, resolutionDeadline,
            id, expectedVersion);
    }

    public int assign(long id, long technicianId, int expectedVersion) {
        return jdbc.update("""
            UPDATE incidentes_produccion SET responsable_id=?,asignacion_fuente='MANUAL',
              regla_asignacion_id=NULL,asignado_at=CURRENT_TIMESTAMP,estado='ASIGNADO',
              version=version+1,updated_at=CURRENT_TIMESTAMP
            WHERE id=? AND estado='CLASIFICADO' AND version=?
            """, technicianId, id, expectedVersion);
    }

    public int assignAutomatically(long id, long technicianId, long ruleId, int expectedVersion) {
        return jdbc.update("""
            UPDATE incidentes_produccion SET responsable_id=?,asignacion_fuente='AUTOMATICA',
              regla_asignacion_id=?,asignado_at=CURRENT_TIMESTAMP,estado='ASIGNADO',
              version=version+1,updated_at=CURRENT_TIMESTAMP
            WHERE id=? AND estado='CLASIFICADO' AND version=?
            """, technicianId, ruleId, id, expectedVersion);
    }

    public int transition(long id, String currentStatus, String status, Long verifierId, int expectedVersion,
                          String deduplicationKey, String detail) {
        return switch (status) {
            case "EN_INVESTIGACION" -> jdbc.update("""
                UPDATE incidentes_produccion SET estado=?,recuperado_at=NULL,verificado_at=NULL,cerrado_at=NULL,
                    verificado_por=NULL,clave_deduplicacion=?,
                    primera_atencion_at=COALESCE(primera_atencion_at,CURRENT_TIMESTAMP),
                    version=version+1,updated_at=CURRENT_TIMESTAMP WHERE id=?
                """ + " AND estado=? AND version=?", status, deduplicationKey, id, currentStatus, expectedVersion);
            case "SERVICIO_RECUPERADO" -> jdbc.update("""
                UPDATE incidentes_produccion SET estado=?,recuperado_at=COALESCE(recuperado_at,CURRENT_TIMESTAMP),verificado_at=NULL,
                    cerrado_at=NULL,verificado_por=NULL,
                    solucion_aplicada=COALESCE(NULLIF(solucion_aplicada,''),?),
                    version=version+1,updated_at=CURRENT_TIMESTAMP WHERE id=?
                """ + " AND estado=? AND version=?", status, detail, id, currentStatus, expectedVersion);
            case "VERIFICADO" -> jdbc.update("""
                UPDATE incidentes_produccion SET estado=?,verificado_por=?,verificado_at=CURRENT_TIMESTAMP,
                    version=version+1,updated_at=CURRENT_TIMESTAMP WHERE id=?
                """ + " AND estado=? AND version=?", status, verifierId, id, currentStatus, expectedVersion);
            case "CERRADO" -> jdbc.update("""
                UPDATE incidentes_produccion SET estado=?,cerrado_at=CURRENT_TIMESTAMP,clave_deduplicacion=NULL,version=version+1,
                    updated_at=CURRENT_TIMESTAMP WHERE id=?
                """ + " AND estado=? AND version=?", status, id, currentStatus, expectedVersion);
            default -> jdbc.update("UPDATE incidentes_produccion SET estado=?,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE id=? AND estado=? AND version=?", status, id, currentStatus, expectedVersion);
        };
    }

    public void addHistory(long id, long actorId, String actorEmail, String previous, String next, String detail) {
        jdbc.update("""
            INSERT INTO incidente_historial(incidente_id,actor_id,actor_email,estado_anterior,estado_nuevo,detalle)
            VALUES(?,?,?,?,?,?)
            """, id, actorId, actorEmail, previous, next, detail);
    }

    public void addActivity(long id, long actorId, String actorEmail, String type, String detail) {
        jdbc.update("""
            INSERT INTO incidente_actividades(incidente_id,actor_id,actor_email,tipo,detalle)
            VALUES(?,?,?,?,?)
            """, id, actorId, actorEmail, type, detail);
        jdbc.update("UPDATE incidentes_produccion SET primera_atencion_at=COALESCE(primera_atencion_at,CURRENT_TIMESTAMP) WHERE id=?", id);
        switch (type) {
            case "RESOLUCION" -> jdbc.update("UPDATE incidentes_produccion SET solucion_aplicada=?,updated_at=CURRENT_TIMESTAMP WHERE id=?", detail, id);
            case "CAUSA" -> jdbc.update("UPDATE incidentes_produccion SET causa_raiz=?,updated_at=CURRENT_TIMESTAMP WHERE id=?", detail, id);
            case "PREVENCION" -> jdbc.update("UPDATE incidentes_produccion SET aprendizaje=?,updated_at=CURRENT_TIMESTAMP WHERE id=?", detail, id);
            default -> { }
        }
    }

    public int updateResolution(long id, String solution, String rootCause, String learning, int expectedVersion) {
        return jdbc.update("""
            UPDATE incidentes_produccion SET solucion_aplicada=?,causa_raiz=?,aprendizaje=?,
              primera_atencion_at=COALESCE(primera_atencion_at,CURRENT_TIMESTAMP),
              version=version+1,updated_at=CURRENT_TIMESTAMP
            WHERE id=? AND estado NOT IN ('VERIFICADO','CERRADO') AND version=?
            """, solution, rootCause, learning, id, expectedVersion);
    }

    public int touchVersion(long id, int expectedVersion) {
        return jdbc.update("UPDATE incidentes_produccion SET version=version+1,updated_at=CURRENT_TIMESTAMP WHERE id=? AND version=?", id, expectedVersion);
    }

    public List<IncidentActivityResponse> activities(long id) {
        return jdbc.query("""
            SELECT id,incidente_id,actor_id,actor_email,tipo,detalle,created_at
            FROM incidente_actividades WHERE incidente_id=? ORDER BY created_at,id
            """, (rs, row) -> new IncidentActivityResponse(rs.getLong(1), rs.getLong(2),
                rs.getObject(3, Long.class), rs.getString(4), rs.getString(5), rs.getString(6), timestamp(rs, 7)), id);
    }

    public List<IncidentHistoryResponse> history(long id) {
        return jdbc.query("""
            SELECT id,incidente_id,actor_id,actor_email,estado_anterior,estado_nuevo,detalle,created_at
            FROM incidente_historial WHERE incidente_id=? ORDER BY created_at,id
            """, (rs, row) -> new IncidentHistoryResponse(rs.getLong(1), rs.getLong(2),
                rs.getObject(3, Long.class), rs.getString(4), rs.getString(5), rs.getString(6),
                rs.getString(7), timestamp(rs, 8)), id);
    }

    public long createEscalation(long incidentId, long actorId, Long destinationUserId, String reason) {
        KeyHolder keys = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                INSERT INTO incidente_escalamientos(incidente_id,escalado_por,escalado_a,motivo)
                VALUES(?,?,?,?)
                """, Statement.RETURN_GENERATED_KEYS);
            statement.setLong(1, incidentId);
            statement.setLong(2, actorId);
            statement.setObject(3, destinationUserId);
            statement.setString(4, reason);
            return statement;
        }, keys);
        Number key = keys.getKey();
        if (key == null) throw new IllegalStateException("No se pudo generar el escalamiento");
        return key.longValue();
    }

    public int resolveEscalation(long incidentId, long escalationId, long actorId, String resolution) {
        return jdbc.update("""
            UPDATE incidente_escalamientos SET resuelto_at=CURRENT_TIMESTAMP,resuelto_por=?,resolucion=?
            WHERE id=? AND incidente_id=? AND resuelto_at IS NULL
            """, actorId, resolution, escalationId, incidentId);
    }

    public List<IncidentEscalationResponse> escalations(long incidentId) {
        return jdbc.query("""
            SELECT id,incidente_id,escalado_por,escalado_a,motivo,created_at,atendido_at,
              resuelto_at,resuelto_por,resolucion
            FROM incidente_escalamientos WHERE incidente_id=? ORDER BY created_at,id
            """, (rs, row) -> new IncidentEscalationResponse(rs.getLong("id"),
                rs.getLong("incidente_id"), rs.getObject("escalado_por", Long.class),
                rs.getObject("escalado_a", Long.class), rs.getString("motivo"),
                timestamp(rs, "created_at"), timestamp(rs, "atendido_at"),
                timestamp(rs, "resuelto_at"), rs.getObject("resuelto_por", Long.class),
                rs.getString("resolucion")), incidentId);
    }

    public boolean ticketExists(long id) {
        Long count = jdbc.queryForObject("SELECT COUNT(*) FROM tickets_soporte WHERE id=?", Long.class, id);
        return count != null && count > 0;
    }

    public boolean changeExists(long id) {
        Long count = jdbc.queryForObject("SELECT COUNT(*) FROM solicitudes_cambio WHERE id=?", Long.class, id);
        return count != null && count > 0;
    }

    public int linkTicket(long incidentId, long ticketId, String relationship, long actorId) {
        return jdbc.update("INSERT IGNORE INTO incidente_ticket(incidente_id,ticket_id,tipo_relacion,vinculado_por) VALUES(?,?,?,?)", incidentId, ticketId, relationship, actorId);
    }

    public int unlinkTicket(long incidentId, long ticketId) {
        return jdbc.update("DELETE FROM incidente_ticket WHERE incidente_id=? AND ticket_id=?", incidentId, ticketId);
    }

    public int linkChange(long incidentId, long changeId, String purpose, long actorId) {
        return jdbc.update("INSERT IGNORE INTO incidente_cambio(incidente_id,solicitud_cambio_id,proposito,vinculado_por) VALUES(?,?,?,?)", incidentId, changeId, purpose, actorId);
    }

    public int unlinkChange(long incidentId, long changeId) {
        return jdbc.update("DELETE FROM incidente_cambio WHERE incidente_id=? AND solicitud_cambio_id=?", incidentId, changeId);
    }

    public List<Long> ticketIds(long id) {
        return jdbc.queryForList("SELECT ticket_id FROM incidente_ticket WHERE incidente_id=? ORDER BY created_at", Long.class, id);
    }

    public List<Long> changeIds(long id) {
        return jdbc.queryForList("SELECT solicitud_cambio_id FROM incidente_cambio WHERE incidente_id=? ORDER BY created_at", Long.class, id);
    }

    private static LocalDateTime timestamp(ResultSet rs, String column) throws SQLException {
        var value = rs.getTimestamp(column);
        return value == null ? null : value.toLocalDateTime();
    }

    private static LocalDateTime timestamp(ResultSet rs, int column) throws SQLException {
        var value = rs.getTimestamp(column);
        return value == null ? null : value.toLocalDateTime();
    }

    private static String normalized(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static String displayStatus(String status, boolean escalated) {
        if (escalated && !"CERRADO".equals(status)) return "ESCALADO";
        return switch (status) {
            case "REGISTRADO", "CLASIFICADO", "ASIGNADO" -> "NUEVO";
            case "EN_INVESTIGACION" -> "EN_DIAGNOSTICO";
            case "EN_MITIGACION" -> "EN_ATENCION";
            case "SERVICIO_RECUPERADO", "VERIFICADO" -> "RESUELTO";
            case "CERRADO" -> "CERRADO";
            default -> status;
        };
    }
}
