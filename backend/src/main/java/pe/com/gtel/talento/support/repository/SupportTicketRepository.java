package pe.com.gtel.talento.support.repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import pe.com.gtel.talento.support.dto.SupportTicketDashboardDTO;
import pe.com.gtel.talento.support.dto.SupportTicketResponse;
import pe.com.gtel.talento.support.dto.TechnicianOption;
import pe.com.gtel.talento.support.dto.TicketCreateRequest;

@Repository
public class SupportTicketRepository {
    private final JdbcTemplate jdbc;

    private static final String SELECT = """
        SELECT t.id,t.codigo,t.titulo,t.categoria,t.subcategoria,t.prioridad,t.descripcion,
               t.justificacion_prioridad,t.area,t.estado,t.solicitante_id,sol.email solicitante_email,
               t.tecnico_id,tec.email tecnico_email,t.diagnostico,t.solucion_propuesta,
               t.estado_propuesta,t.comentario_admin,t.evidencia_ejecucion,
               t.created_at,t.updated_at,t.resolved_at
        FROM tickets_soporte t
        JOIN usuarios sol ON sol.id=t.solicitante_id
        LEFT JOIN usuarios tec ON tec.id=t.tecnico_id
        """;

    private final RowMapper<SupportTicketResponse> mapper = (rs, row) -> new SupportTicketResponse(
        rs.getLong("id"), rs.getString("codigo"), rs.getString("titulo"),
        rs.getString("categoria"), rs.getString("subcategoria"), rs.getString("prioridad"),
        rs.getString("descripcion"), rs.getString("justificacion_prioridad"), rs.getString("area"),
        rs.getString("estado"), rs.getLong("solicitante_id"), rs.getString("solicitante_email"),
        rs.getObject("tecnico_id", Long.class), rs.getString("tecnico_email"),
        rs.getString("diagnostico"), rs.getString("solucion_propuesta"),
        rs.getString("estado_propuesta"), rs.getString("comentario_admin"),
        rs.getString("evidencia_ejecucion"),
        rs.getTimestamp("created_at").toLocalDateTime(),
        rs.getTimestamp("updated_at").toLocalDateTime(),
        rs.getTimestamp("resolved_at") == null ? null : rs.getTimestamp("resolved_at").toLocalDateTime());

    public SupportTicketRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public long create(long requesterId, TicketCreateRequest request) {
        KeyHolder keys = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                INSERT INTO tickets_soporte(titulo,categoria,subcategoria,prioridad,descripcion,
                    justificacion_prioridad,area,estado,solicitante_id,estado_propuesta)
                VALUES(?,?,?,?,?,?,'Reclutamiento','NUEVO',?,'SIN_PROPUESTA')
                """, Statement.RETURN_GENERATED_KEYS);
            statement.setString(1, request.title().trim());
            statement.setString(2, request.category().trim());
            statement.setString(3, request.subcategory().trim());
            statement.setString(4, request.priority());
            statement.setString(5, request.description().trim());
            statement.setString(6, request.priorityJustification().trim());
            statement.setLong(7, requesterId);
            return statement;
        }, keys);
        Number key = keys.getKey();
        if (key == null) throw new IllegalStateException("No se pudo generar el ticket");
        long id = key.longValue();
        jdbc.update("UPDATE tickets_soporte SET codigo=? WHERE id=?", "SR-" + String.format("%06d", id), id);
        return id;
    }

    public List<SupportTicketResponse> listAll() {
        return jdbc.query(SELECT + " ORDER BY t.created_at DESC,t.id DESC", mapper);
    }

    public List<SupportTicketResponse> listForRequester(long requesterId) {
        return jdbc.query(SELECT + " WHERE t.solicitante_id=? ORDER BY t.created_at DESC,t.id DESC", mapper, requesterId);
    }

    public List<SupportTicketResponse> listForTechnician(long technicianId) {
        return jdbc.query(SELECT + " WHERE t.tecnico_id IS NULL OR t.tecnico_id=? ORDER BY t.created_at DESC,t.id DESC", mapper, technicianId);
    }

    public SupportTicketResponse find(long id) {
        return jdbc.query(SELECT + " WHERE t.id=?", mapper, id).stream().findFirst().orElse(null);
    }

    public List<TechnicianOption> technicians() {
        return jdbc.query("""
            SELECT u.id,u.email FROM usuarios u JOIN roles r ON r.id=u.rol_id
            WHERE r.nombre='TECNICO' AND u.estado='activo' ORDER BY u.email
            """, (rs,row)->new TechnicianOption(rs.getLong(1),rs.getString(2)));
    }

    public boolean isActiveTechnician(long id) {
        Long count = jdbc.queryForObject("""
            SELECT COUNT(*) FROM usuarios u JOIN roles r ON r.id=u.rol_id
            WHERE u.id=? AND u.estado='activo' AND r.nombre='TECNICO'
            """, Long.class, id);
        return count != null && count > 0;
    }

    public void assign(long id, long technicianId) {
        jdbc.update("UPDATE tickets_soporte SET tecnico_id=?,estado=CASE WHEN estado='NUEVO' THEN 'ASIGNADO' ELSE estado END,updated_at=CURRENT_TIMESTAMP WHERE id=?", technicianId, id);
    }

    public void updateStatus(long id, String status) {
        jdbc.update("""
            UPDATE tickets_soporte
            SET estado=?,
                resolved_at=CASE
                    WHEN ? IN ('RESUELTO','CERRADO') THEN COALESCE(resolved_at,CURRENT_TIMESTAMP)
                    ELSE NULL
                END,
                updated_at=CURRENT_TIMESTAMP
            WHERE id=?
            """, status, status, id);
    }

    public void saveProposal(long id, String diagnosis, String solution) {
        jdbc.update("""
            UPDATE tickets_soporte SET diagnostico=?,solucion_propuesta=?,estado_propuesta='PENDIENTE',
                comentario_admin=NULL,estado='EN_ESPERA',updated_at=CURRENT_TIMESTAMP WHERE id=?
            """, diagnosis, solution, id);
    }

    public void decide(long id, boolean approved, String comment) {
        jdbc.update("""
            UPDATE tickets_soporte SET estado_propuesta=?,comentario_admin=?,estado='ASIGNADO',
                updated_at=CURRENT_TIMESTAMP WHERE id=?
            """, approved ? "APROBADA" : "RECHAZADA", comment, id);
    }

    public void saveExecution(long id, String evidence) {
        jdbc.update("""
            UPDATE tickets_soporte SET evidencia_ejecucion=?,estado='RESUELTO',resolved_at=CURRENT_TIMESTAMP,
                updated_at=CURRENT_TIMESTAMP WHERE id=?
            """, evidence, id);
    }

    public void addHistory(long ticketId, long actorId, String previousStatus, String nextStatus, String detail) {
        jdbc.update("""
            INSERT INTO ticket_soporte_historial(ticket_id,actor_id,estado_anterior,estado_nuevo,detalle)
            VALUES(?,?,?,?,?)
            """, ticketId, actorId, previousStatus, nextStatus, detail);
    }

    /**
     * Conserva un resumen auditable y elimina los tickets operativos terminales anteriores al corte.
     * El historial detallado se elimina por ON DELETE CASCADE junto con el ticket.
     */
    public int archiveAndDeleteTerminalTicketsBefore(LocalDateTime cutoff) {
        jdbc.update("""
            INSERT INTO tickets_soporte_archivo(
                ticket_id,codigo,solicitante_email,tecnico_email,area,titulo,categoria,prioridad,
                estado_final,resumen_resolucion,cantidad_eventos,ultimo_evento,created_at,resolved_at,archived_at)
            SELECT t.id,t.codigo,sol.email,tec.email,t.area,t.titulo,t.categoria,t.prioridad,
                   t.estado,t.evidencia_ejecucion,
                   (SELECT COUNT(*) FROM ticket_soporte_historial h WHERE h.ticket_id=t.id),
                   (SELECT h.detalle FROM ticket_soporte_historial h
                    WHERE h.ticket_id=t.id ORDER BY h.created_at DESC,h.id DESC LIMIT 1),
                   t.created_at,t.resolved_at,CURRENT_TIMESTAMP
            FROM tickets_soporte t
            JOIN usuarios sol ON sol.id=t.solicitante_id
            LEFT JOIN usuarios tec ON tec.id=t.tecnico_id
            JOIN ticket_soporte_estados e ON e.codigo=t.estado AND e.terminal=TRUE
            WHERE t.resolved_at IS NOT NULL AND t.resolved_at<=?
            ON DUPLICATE KEY UPDATE
                tecnico_email=VALUES(tecnico_email),
                estado_final=VALUES(estado_final),
                resumen_resolucion=VALUES(resumen_resolucion),
                cantidad_eventos=VALUES(cantidad_eventos),
                ultimo_evento=VALUES(ultimo_evento),
                resolved_at=VALUES(resolved_at),
                archived_at=CURRENT_TIMESTAMP
            """, cutoff);

        jdbc.update("""
            INSERT INTO auditoria(tabla_afectada,registro_id,accion,detalle,usuario_id)
            SELECT 'tickets_soporte',t.id,'eliminar',
                   CONCAT('Depuracion automatica; resumen conservado en tickets_soporte_archivo: ',t.codigo),NULL
            FROM tickets_soporte t
            JOIN tickets_soporte_archivo a ON a.ticket_id=t.id
            JOIN ticket_soporte_estados e ON e.codigo=t.estado AND e.terminal=TRUE
            WHERE t.resolved_at IS NOT NULL AND t.resolved_at<=?
            """, cutoff);

        return jdbc.update("""
            DELETE t FROM tickets_soporte t
            JOIN tickets_soporte_archivo a ON a.ticket_id=t.id
            JOIN ticket_soporte_estados e ON e.codigo=t.estado AND e.terminal=TRUE
            WHERE t.resolved_at IS NOT NULL AND t.resolved_at<=?
            """, cutoff);
    }
    public List<SupportTicketDashboardDTO> getDashboardBoard() {
        return getDashboardBoard(null);
    }

    public List<SupportTicketDashboardDTO> getDashboardBoard(Long technicianId) {
        String sql = """
            SELECT t.id, t.codigo, t.titulo, t.categoria, t.prioridad, 
                   COALESCE(tec.email, 'Sin asignar') AS asignado_a, estado.codigo AS estado, t.created_at,
                   DATE_ADD(t.created_at, INTERVAL sla.horas_respuesta HOUR) AS sla_deadline,
                   CASE 
                       WHEN estado.terminal = TRUE THEN 'CUMPLIDO'
                       WHEN CURRENT_TIMESTAMP > DATE_ADD(t.created_at, INTERVAL sla.horas_respuesta HOUR) THEN 'VENCIDO'
                       WHEN CURRENT_TIMESTAMP >= DATE_SUB(DATE_ADD(t.created_at, INTERVAL sla.horas_respuesta HOUR), INTERVAL 2 HOUR) THEN 'POR VENCER'
                       ELSE 'A TIEMPO'
                   END AS sla_status
            FROM tickets_soporte t
            JOIN ticket_soporte_estados estado ON estado.codigo = t.estado
            JOIN ticket_sla_politicas sla ON sla.prioridad = t.prioridad AND sla.activo = TRUE
            LEFT JOIN usuarios tec ON tec.id = t.tecnico_id
            %s
            ORDER BY 
                CASE WHEN estado.terminal = FALSE THEN 1 ELSE 2 END,
                sla_deadline ASC
            """.formatted(technicianId == null ? "" : "WHERE t.tecnico_id IS NULL OR t.tecnico_id = ?");

        RowMapper<SupportTicketDashboardDTO> mapper = (rs, row) -> new SupportTicketDashboardDTO(
            rs.getLong("id"), rs.getString("codigo"), rs.getString("titulo"),
            rs.getString("categoria"), rs.getString("prioridad"), rs.getString("asignado_a"),
            rs.getString("estado"), rs.getTimestamp("created_at").toLocalDateTime(),
            rs.getTimestamp("sla_deadline").toLocalDateTime(), rs.getString("sla_status")
        );
        return technicianId == null ? jdbc.query(sql, mapper) : jdbc.query(sql, mapper, technicianId);
    }
}
