package pe.com.gtel.talento.recruitment.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
public class WorkflowIdentity {
    private final JdbcTemplate jdbc;
    public WorkflowIdentity(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    public record Actor(long id, String role) {}
    public Actor actor(String email) {
        return jdbc.query("SELECT u.id,r.nombre FROM usuarios u JOIN roles r ON r.id=u.rol_id WHERE LOWER(u.email)=LOWER(?) AND u.estado='activo'",
            (r,n)->new Actor(r.getLong(1),r.getString(2)),email).stream().findFirst()
            .orElseThrow(()->new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }
    public void recruiter(Actor actor) {
        if (!"ADMIN".equals(actor.role()) && !"RECLUTADOR".equals(actor.role()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }
    public void audit(Actor actor, String table, long id, String action, String detail) {
        jdbc.update("INSERT INTO auditoria(tabla_afectada,registro_id,accion,detalle,usuario_id) VALUES(?,?,?,?,?)",
            table,id,action,detail,actor.id());
    }
}
