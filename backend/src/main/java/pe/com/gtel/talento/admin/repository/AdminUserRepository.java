package pe.com.gtel.talento.admin.repository;

import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import pe.com.gtel.talento.admin.dto.AdminUserResponse;
import pe.com.gtel.talento.admin.dto.UserRequest;

@Repository
public class AdminUserRepository {
    private final org.springframework.jdbc.core.RowMapper<AdminUserResponse> mapper=(r,n)->new AdminUserResponse(
        r.getLong("id"),r.getString("email"),r.getString("rol"),r.getString("estado"),
        r.getString("nombres"),r.getString("apellidos"),r.getString("telefono"));
    private final JdbcTemplate jdbc;
    public AdminUserRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    private static final String VIEW="""
        SELECT u.id,u.email,r.nombre rol,u.estado,COALESCE(p.nombres,'') nombres,
        COALESCE(p.apellidos,'') apellidos,COALESCE(p.telefono,'') telefono
        FROM usuarios u JOIN roles r ON r.id=u.rol_id LEFT JOIN postulantes p ON p.usuario_id=u.id
        """;

    public List<AdminUserResponse> list(String pattern,int page) {
        return jdbc.query(VIEW+" WHERE LOWER(u.email) LIKE ? ORDER BY u.id DESC LIMIT 25 OFFSET ?",mapper,pattern,page*25);
    }

    public Long count(String pattern) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM usuarios WHERE LOWER(email) LIKE ?",Long.class,pattern);
    }

    public Long lockAdminRole() {
        return jdbc.queryForObject("SELECT id FROM roles WHERE nombre='ADMIN' FOR UPDATE",Long.class);
    }

    public Long actorId(String actor) {
        return jdbc.queryForObject("SELECT id FROM usuarios WHERE LOWER(email)=LOWER(?)",Long.class,actor);
    }

    public Long roleId(String role) {
        return jdbc.queryForObject("SELECT id FROM roles WHERE nombre=?",Long.class,role);
    }

    public Long countDuplicateEmail(String email,long excludedId) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM usuarios WHERE LOWER(email)=? AND id<>?",Long.class,email,excludedId);
    }

    public void insert(String email,String hash,long roleId,String state) {
        jdbc.update("INSERT INTO usuarios(email,password_hash,rol_id,estado) VALUES(?,?,?,?)",email,hash,roleId,state);
    }

    public Long idByEmail(String email) {
        return jdbc.queryForObject("SELECT id FROM usuarios WHERE email=?",Long.class,email);
    }

    public List<AdminUserResponse> find(long id) {
        return jdbc.query(VIEW+" WHERE u.id=?",mapper,id);
    }

    public Long activeAdmins() {
        return jdbc.queryForObject("SELECT COUNT(*) FROM usuarios u JOIN roles r ON r.id=u.rol_id WHERE r.nombre='ADMIN' AND u.estado='activo'",Long.class);
    }

    public void update(long id,String email,long roleId,String state,String hash,boolean keepExemption) {
        jdbc.update("UPDATE usuarios SET email=?,rol_id=?,estado=?,password_hash=COALESCE(?,password_hash),auth_version=auth_version+1,otp_exempt=CASE WHEN ? THEN otp_exempt ELSE FALSE END WHERE id=?",
                email,roleId,state,hash,keepExemption,id);
    }

    public void deleteOtp(long id) {
        jdbc.update("DELETE FROM auth_email_challenges WHERE usuario_id=?",id);
    }

    public void deleteRecovery(long id) {
        jdbc.update("DELETE FROM recuperacion_acceso WHERE usuario_id=?",id);
    }

    public void saveCandidate(long id,UserRequest request) {
        jdbc.update("""
                INSERT INTO postulantes(usuario_id,nombres,apellidos,telefono) VALUES(?,?,?,?)
                ON DUPLICATE KEY UPDATE nombres=VALUES(nombres),apellidos=VALUES(apellidos),telefono=VALUES(telefono)
                """,id,request.nombres().trim(),request.apellidos().trim(),request.telefono());
    }

    public void updateContact(long id,UserRequest request) {
        jdbc.update("UPDATE perfiles_contacto SET nombres=?,apellidos=?,telefono=? WHERE usuario_id=?",
                request.nombres().trim(),request.apellidos().trim(),request.telefono(),id);
    }

    public void audit(long id,boolean creating,String auditDetail,long actorId) {
        jdbc.update("INSERT INTO auditoria(tabla_afectada,registro_id,accion,detalle,usuario_id) VALUES('usuarios',?,?,?,?)",
            id,creating?"crear":"actualizar",auditDetail,actorId);
    }

    public List<AdminUserResponse> get(long id) {
        return jdbc.query(VIEW+" WHERE u.id=?",mapper,id);
    }
}
