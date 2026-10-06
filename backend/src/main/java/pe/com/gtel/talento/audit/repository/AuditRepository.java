package pe.com.gtel.talento.audit.repository;

import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AuditRepository {
    private final JdbcTemplate jdbc;

    public AuditRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Map<String, Object>> list(int offset) {
        return jdbc.queryForList("""
            SELECT a.id,a.tabla_afectada entidad,a.registro_id registro,a.accion,a.detalle,
                   a.fecha_accion fecha,COALESCE(u.email,a.actor_email_historico) actor
            FROM auditoria a LEFT JOIN usuarios u ON u.id=a.usuario_id
            ORDER BY a.id DESC LIMIT 25 OFFSET ?
            """, offset);
    }

    public long count() {
        return jdbc.queryForObject("SELECT COUNT(*) FROM auditoria", Long.class);
    }

    public void insert(long actorId, String table, long id, String action, String detail) {
        jdbc.update("""
            INSERT INTO auditoria(tabla_afectada,registro_id,accion,detalle,usuario_id)
            VALUES(?,?,?,?,?)
            """, table, id, action, detail, actorId);
    }
}
