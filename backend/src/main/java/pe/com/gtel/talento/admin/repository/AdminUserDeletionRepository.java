package pe.com.gtel.talento.admin.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AdminUserDeletionRepository {
    private final JdbcTemplate jdbc;
    public AdminUserDeletionRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public Long lockAdminRole() {
        return jdbc.queryForObject("SELECT id FROM roles WHERE nombre='ADMIN' FOR UPDATE",Long.class);
    }

    public Long lockRecruiterRole() {
        return jdbc.queryForObject("SELECT id FROM roles WHERE nombre='RECLUTADOR' FOR UPDATE",Long.class);
    }

    public java.util.List<Long> activeAdminsByEmail(String email) {
        return jdbc.queryForList("SELECT u.id FROM usuarios u JOIN roles r ON r.id=u.rol_id WHERE LOWER(u.email)=LOWER(?) AND u.estado='activo' AND r.nombre='ADMIN'",Long.class,email);
    }

    public java.util.List<java.util.Map<String,Object>> lockUser(long id) {
        return jdbc.queryForList("SELECT email,rol_id,estado FROM usuarios WHERE id=? FOR UPDATE",id);
    }

    public Long adminRole() {
        return jdbc.queryForObject("SELECT id FROM roles WHERE nombre='ADMIN'",Long.class);
    }

    public Integer activeAdminCount(long adminRole) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM usuarios WHERE rol_id=? AND estado='activo'",Integer.class,adminRole);
    }

    public java.util.List<Long> lockProfiles(long id) {
        return jdbc.queryForList("SELECT id FROM postulantes WHERE usuario_id=? FOR UPDATE",Long.class,id);
    }

    public java.util.List<Long> lockApplications(long profile) {
        return jdbc.queryForList("SELECT id FROM postulaciones WHERE postulante_id=? FOR UPDATE",Long.class,profile);
    }

    public void deleteCriteria(long application) {
        jdbc.update("DELETE FROM evaluacion_detalle WHERE evaluacion_id IN (SELECT id FROM evaluaciones WHERE postulacion_id=?)",application);
    }

    public void deleteEvaluations(long application) {
        jdbc.update("DELETE FROM evaluaciones WHERE postulacion_id=?",application);
    }

    public void deleteInterviews(long application) {
        jdbc.update("DELETE FROM entrevistas WHERE postulacion_id=?",application);
    }

    public void deleteTimeline(long application) {
        jdbc.update("DELETE FROM postulacion_timeline WHERE postulacion_id=?",application);
    }

    public void deleteDocuments(long application) {
        jdbc.update("DELETE FROM documentos_postulacion WHERE postulacion_id=?",application);
    }

    public void deleteApplication(long application) {
        jdbc.update("DELETE FROM postulaciones WHERE id=?",application);
    }

    public void transferJobs(long actor,long id) {
        jdbc.update("UPDATE vacantes SET reclutador_id=? WHERE reclutador_id=?",actor,id);
    }

    public void transferRequests(long actor,long id) {
        jdbc.update("UPDATE requerimientos_personal SET solicitante_id=? WHERE solicitante_id=?",actor,id);
    }

    public void transferTrash(long actor,long id) {
        jdbc.update("UPDATE vacantes_papelera SET usuario_id=? WHERE usuario_id=?",actor,id);
    }

    public void detachEvaluations(long id) {
        jdbc.update("UPDATE evaluaciones SET usuario_id=NULL WHERE usuario_id=?",id);
    }

    public void detachTimeline(long id) {
        jdbc.update("UPDATE postulacion_timeline SET usuario_id=NULL WHERE usuario_id=?",id);
    }

    public void deleteProfiles(long id) {
        jdbc.update("DELETE FROM postulantes WHERE usuario_id=?",id);
    }

    public void deleteContacts(long id) {
        jdbc.update("DELETE FROM perfiles_contacto WHERE usuario_id=?",id);
    }

    public void deleteOtp(long id) {
        jdbc.update("DELETE FROM auth_email_challenges WHERE usuario_id=?",id);
    }

    public void deleteRecovery(long id) {
        jdbc.update("DELETE FROM recuperacion_acceso WHERE usuario_id=?",id);
    }

    public void deleteNotifications(long id) {
        jdbc.update("DELETE FROM notificaciones WHERE usuario_id=?",id);
    }

    public void preserveAuditActor(long id,Object email) {
        jdbc.update("UPDATE auditoria SET actor_id_historico=?,actor_email_historico=?,usuario_id=NULL WHERE usuario_id=?",id,email,id);
    }

    public void auditDeletion(long id,Object email,long actor) {
        jdbc.update("INSERT INTO auditoria(tabla_afectada,registro_id,accion,detalle,usuario_id) VALUES('usuarios',?,'eliminar',?,?)",id,"Eliminación definitiva de cuenta: "+email,actor);
    }

    public void deleteUser(long id) {
        jdbc.update("DELETE FROM usuarios WHERE id=?",id);
    }
}
