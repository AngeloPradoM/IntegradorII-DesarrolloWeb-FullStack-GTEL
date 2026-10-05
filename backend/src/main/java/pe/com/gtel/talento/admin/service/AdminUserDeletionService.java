package pe.com.gtel.talento.admin.service;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;
@Service
public class AdminUserDeletionService {
    private final JdbcTemplate jdbc;
    public AdminUserDeletionService(JdbcTemplate jdbc){this.jdbc=jdbc;}
    @Transactional public void delete(long id,String email){
        jdbc.queryForObject("SELECT id FROM roles WHERE nombre='ADMIN' FOR UPDATE",Long.class);
        jdbc.queryForObject("SELECT id FROM roles WHERE nombre='RECLUTADOR' FOR UPDATE",Long.class);
        var actors=jdbc.queryForList("SELECT u.id FROM usuarios u JOIN roles r ON r.id=u.rol_id WHERE LOWER(u.email)=LOWER(?) AND u.estado='activo' AND r.nombre='ADMIN'",Long.class,email);
        if(actors.isEmpty())throw new ResponseStatusException(FORBIDDEN);
        long actor=actors.getFirst();
        if(actor==id)throw new ResponseStatusException(BAD_REQUEST,"No puedes eliminar tu propia cuenta.");
        var users=jdbc.queryForList("SELECT email,rol_id,estado FROM usuarios WHERE id=? FOR UPDATE",id);
        if(users.isEmpty())throw new ResponseStatusException(NOT_FOUND,"La cuenta ya no existe.");
        var user=users.getFirst();
        long adminRole=jdbc.queryForObject("SELECT id FROM roles WHERE nombre='ADMIN'",Long.class);
        if(((Number)user.get("rol_id")).longValue()==adminRole&&"activo".equals(user.get("estado"))&&jdbc.queryForObject("SELECT COUNT(*) FROM usuarios WHERE rol_id=? AND estado='activo'",Integer.class,adminRole)<=1)
            throw new ResponseStatusException(CONFLICT,"Debe quedar un administrador activo.");
        var profiles=jdbc.queryForList("SELECT id FROM postulantes WHERE usuario_id=? FOR UPDATE",Long.class,id);
        for(long profile:profiles){
            var applications=jdbc.queryForList("SELECT id FROM postulaciones WHERE postulante_id=? FOR UPDATE",Long.class,profile);
            for(long application:applications){
                jdbc.update("DELETE FROM evaluacion_detalle WHERE evaluacion_id IN (SELECT id FROM evaluaciones WHERE postulacion_id=?)",application);
                jdbc.update("DELETE FROM evaluaciones WHERE postulacion_id=?",application);
                jdbc.update("DELETE FROM entrevistas WHERE postulacion_id=?",application);
                jdbc.update("DELETE FROM postulacion_timeline WHERE postulacion_id=?",application);
                jdbc.update("DELETE FROM documentos_postulacion WHERE postulacion_id=?",application);
                jdbc.update("DELETE FROM postulaciones WHERE id=?",application);
            }
        }
        // Preserve shared business records, removing all references to the deleted identity.
        jdbc.update("UPDATE vacantes SET reclutador_id=? WHERE reclutador_id=?",actor,id);
        jdbc.update("UPDATE requerimientos_personal SET solicitante_id=? WHERE solicitante_id=?",actor,id);
        jdbc.update("UPDATE vacantes_papelera SET usuario_id=? WHERE usuario_id=?",actor,id);
        jdbc.update("UPDATE evaluaciones SET usuario_id=NULL WHERE usuario_id=?",id);
        jdbc.update("UPDATE postulacion_timeline SET usuario_id=NULL WHERE usuario_id=?",id);
        jdbc.update("DELETE FROM postulantes WHERE usuario_id=?",id);
        jdbc.update("DELETE FROM perfiles_contacto WHERE usuario_id=?",id);
        jdbc.update("DELETE FROM auth_email_challenges WHERE usuario_id=?",id);
        jdbc.update("DELETE FROM recuperacion_acceso WHERE usuario_id=?",id);
        jdbc.update("DELETE FROM notificaciones WHERE usuario_id=?",id);
        jdbc.update("UPDATE auditoria SET actor_id_historico=?,actor_email_historico=?,usuario_id=NULL WHERE usuario_id=?",id,user.get("email"),id);
        jdbc.update("INSERT INTO auditoria(tabla_afectada,registro_id,accion,detalle,usuario_id) VALUES('usuarios',?,'eliminar',?,?)",id,"Eliminación definitiva de cuenta: "+user.get("email"),actor);
        jdbc.update("DELETE FROM usuarios WHERE id=?",id);
    }
}
