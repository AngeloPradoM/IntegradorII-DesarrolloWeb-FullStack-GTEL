package pe.com.gtel.talento.identity.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import pe.com.gtel.talento.identity.dto.WorkflowActor;

@Repository
public class WorkflowIdentityRepository {
    private final JdbcTemplate jdbc;
    public WorkflowIdentityRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public java.util.List<WorkflowActor> findActive(String email) {
        return jdbc.query("SELECT u.id,r.nombre FROM usuarios u JOIN roles r ON r.id=u.rol_id WHERE LOWER(u.email)=LOWER(?) AND u.estado='activo'",
            (r,n)->new WorkflowActor(r.getLong(1),r.getString(2)),email);
    }
}
