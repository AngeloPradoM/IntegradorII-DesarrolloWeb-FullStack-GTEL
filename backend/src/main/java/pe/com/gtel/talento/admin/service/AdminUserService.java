package pe.com.gtel.talento.admin.service;

import java.util.*;
import java.nio.charset.StandardCharsets;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import pe.com.gtel.talento.admin.dto.UserRequest;

@Service
public class AdminUserService {
    private final JdbcTemplate jdbc;
    private final PasswordEncoder encoder;
    public AdminUserService(JdbcTemplate jdbc,PasswordEncoder encoder){this.jdbc=jdbc;this.encoder=encoder;}
    public record UserView(long id,String email,String rol,String estado,String nombres,String apellidos,String telefono) {}
    private static final String VIEW="""
        SELECT u.id,u.email,r.nombre rol,u.estado,COALESCE(p.nombres,'') nombres,
        COALESCE(p.apellidos,'') apellidos,COALESCE(p.telefono,'') telefono
        FROM usuarios u JOIN roles r ON r.id=u.rol_id LEFT JOIN postulantes p ON p.usuario_id=u.id
        """;
    private final org.springframework.jdbc.core.RowMapper<UserView> mapper=(r,n)->new UserView(
        r.getLong("id"),r.getString("email"),r.getString("rol"),r.getString("estado"),
        r.getString("nombres"),r.getString("apellidos"),r.getString("telefono"));
    @Transactional(readOnly=true)
    public Map<String,Object> list(String search,int page) {
        if(page<0||page>100000)throw bad("Página inválida");
        String pattern="%"+search.toLowerCase(Locale.ROOT)+"%";
        return Map.of("items",jdbc.query(VIEW+" WHERE LOWER(u.email) LIKE ? ORDER BY u.id DESC LIMIT 25 OFFSET ?",mapper,pattern,page*25),
            "total",jdbc.queryForObject("SELECT COUNT(*) FROM usuarios WHERE LOWER(email) LIKE ?",Long.class,pattern),"page",page);
    }
    @Transactional
    public UserView save(Long id,UserRequest request,String actor) {
        // Serialize administration to preserve the last active administrator even under concurrent edits.
        jdbc.queryForObject("SELECT id FROM roles WHERE nombre='ADMIN' FOR UPDATE",Long.class);
        Long actorId=jdbc.queryForObject("SELECT id FROM usuarios WHERE LOWER(email)=LOWER(?)",Long.class,actor);
        boolean creating=id==null;
        String auditDetail="Creación de cuenta; rol: "+request.rol()+"; estado: "+request.estado();
        String email=request.email().trim().toLowerCase(Locale.ROOT);
        String hash=null;
        if(request.password()!=null&&!request.password().isBlank()){
            if(request.password().length()<12 || request.password().getBytes(StandardCharsets.UTF_8).length>72)
                throw bad("La contraseña debe tener al menos 12 caracteres y no superar 72 bytes.");
            hash=encoder.encode(request.password());
        } else if(id==null)throw bad("La contraseña es obligatoria para crear usuarios.");
        if("CANDIDATO".equals(request.rol()) && (blank(request.nombres())||blank(request.apellidos())))
            throw bad("Nombres y apellidos son obligatorios para candidatos.");
        Long roleId=jdbc.queryForObject("SELECT id FROM roles WHERE nombre=?",Long.class,request.rol());
        if(jdbc.queryForObject("SELECT COUNT(*) FROM usuarios WHERE LOWER(email)=? AND id<>?",Long.class,email,id==null?-1:id)>0)
            throw new ResponseStatusException(HttpStatus.CONFLICT,"El correo ya está registrado.");
        if(id==null){
            jdbc.update("INSERT INTO usuarios(email,password_hash,rol_id,estado) VALUES(?,?,?,?)",email,hash,roleId,request.estado());
            id=jdbc.queryForObject("SELECT id FROM usuarios WHERE email=?",Long.class,email);
        } else {
            var old=jdbc.query(VIEW+" WHERE u.id=?",mapper,id).stream().findFirst().orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Usuario no encontrado"));
            auditDetail="Edición de cuenta";
            if(!old.rol().equals(request.rol())) auditDetail+="; cambio de rol: "+old.rol()+" -> "+request.rol();
            if(!old.estado().equals(request.estado())) auditDetail+="; "+("activo".equals(request.estado())?"activación":"desactivación")+": "+old.estado()+" -> "+request.estado();
            if(!old.email().equalsIgnoreCase(email)) auditDetail+="; cambio de correo";
            if(hash!=null) auditDetail+="; cambio de contraseña";
            if(old.email().equalsIgnoreCase(actor) && (!"ADMIN".equals(request.rol())||!"activo".equals(request.estado())))
                throw bad("No puedes quitarte el acceso de administrador ni desactivar tu propia cuenta.");
            if("ADMIN".equals(old.rol())&&"activo".equals(old.estado())&&(!"ADMIN".equals(request.rol())||!"activo".equals(request.estado()))
                &&jdbc.queryForObject("SELECT COUNT(*) FROM usuarios u JOIN roles r ON r.id=u.rol_id WHERE r.nombre='ADMIN' AND u.estado='activo'",Long.class)<=1)
                throw bad("Debe existir al menos un administrador activo.");
            jdbc.update("UPDATE usuarios SET email=?,rol_id=?,estado=?,password_hash=COALESCE(?,password_hash),auth_version=auth_version+1,otp_exempt=CASE WHEN ? THEN otp_exempt ELSE FALSE END WHERE id=?",
                email,roleId,request.estado(),hash,old.email().equalsIgnoreCase(email)&&old.rol().equals(request.rol()),id);
            // Pending OTPs cannot survive a password, role, email or status update.
            jdbc.update("DELETE FROM auth_email_challenges WHERE usuario_id=?",id);
            jdbc.update("DELETE FROM recuperacion_acceso WHERE usuario_id=?",id);
        }
        if("CANDIDATO".equals(request.rol())){
            jdbc.update("""
                INSERT INTO postulantes(usuario_id,nombres,apellidos,telefono) VALUES(?,?,?,?)
                ON DUPLICATE KEY UPDATE nombres=VALUES(nombres),apellidos=VALUES(apellidos),telefono=VALUES(telefono)
                """,id,request.nombres().trim(),request.apellidos().trim(),request.telefono());
            jdbc.update("UPDATE perfiles_contacto SET nombres=?,apellidos=?,telefono=? WHERE usuario_id=?",
                request.nombres().trim(),request.apellidos().trim(),request.telefono(),id);
        }
        jdbc.update("INSERT INTO auditoria(tabla_afectada,registro_id,accion,detalle,usuario_id) VALUES('usuarios',?,?,?,?)",
            id,creating?"crear":"actualizar",auditDetail,actorId);
        // Keep historical candidate profiles on role changes; they may have applications attached.
        return jdbc.query(VIEW+" WHERE u.id=?",mapper,id).getFirst();
    }
    private boolean blank(String value){return value==null||value.isBlank();}
    private ResponseStatusException bad(String message){return new ResponseStatusException(HttpStatus.BAD_REQUEST,message);}
}
