package pe.com.gtel.talento.bootstrap.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class DevelopmentAccountRepository {
    private final JdbcTemplate jdbc;
    public DevelopmentAccountRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public Long roleId(String role) {
        return jdbc.queryForObject("SELECT id FROM roles WHERE nombre=?",Long.class,role);
    }

    public java.util.List<java.util.Map<String,Object>> lockByEmail(String email) {
        return jdbc.queryForList("SELECT id,password_hash,rol_id FROM usuarios WHERE LOWER(email)=? FOR UPDATE",email);
    }

    public Long deletedCount(String email) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM auditoria WHERE tabla_afectada='usuarios' AND accion='eliminar' AND detalle=?",Long.class,"Eliminación definitiva de cuenta: "+email);
    }

    public void insert(String email,String passwordHash,long roleId) {
        jdbc.update("INSERT INTO usuarios(email,password_hash,rol_id,estado,otp_exempt) VALUES(?,?,?,'activo',TRUE)",email,passwordHash,roleId);
    }

    public void markExempt(Object id) {
        jdbc.update("UPDATE usuarios SET otp_exempt=TRUE WHERE id=?",id);
    }

    public Long userId(String email) {
        return jdbc.queryForObject("SELECT id FROM usuarios WHERE LOWER(email)=?",Long.class,email);
    }

    public Long profileCount(long id) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM postulantes WHERE usuario_id=?",Long.class,id);
    }

    public void insertProfile(long id) {
        jdbc.update("INSERT INTO postulantes(usuario_id,nombres,apellidos) VALUES(?,'Postulante','De Prueba')",id);
    }
}
