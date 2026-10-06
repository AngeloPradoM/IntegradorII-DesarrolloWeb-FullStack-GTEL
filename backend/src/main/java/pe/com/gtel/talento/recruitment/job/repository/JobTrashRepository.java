package pe.com.gtel.talento.recruitment.job.repository;

import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class JobTrashRepository {
    private final JdbcTemplate jdbc;
    public JobTrashRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public Long lockRecruiterRole() {
        return jdbc.queryForObject("SELECT id FROM roles WHERE nombre='RECLUTADOR' FOR UPDATE",Long.class);
    }

    public List<Long> lockJob(long id) {
        return jdbc.queryForList("SELECT id FROM vacantes WHERE id=? FOR UPDATE",Long.class,id);
    }

    public List<Map<String,Object>> list() {
        return jdbc.queryForList("SELECT v.id,v.titulo title,p.eliminada_en deletedAt,p.eliminar_despues expiresAt FROM vacantes_papelera p JOIN vacantes v ON v.id=p.vacante_id ORDER BY p.eliminada_en DESC");
    }

    public Integer count(long id) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM vacantes_papelera WHERE vacante_id=?",Integer.class,id);
    }

    public void insert(long id,long now,long expires,long actorId) {
        jdbc.update("INSERT INTO vacantes_papelera VALUES(?,?,?,?)",id,now,expires,actorId);
    }

    public void closeJob(long id) {
        jdbc.update("UPDATE vacantes SET estado='cerrada',fecha_cierre=CURRENT_DATE WHERE id=?",id);
    }

    public List<Long> expiry(long id) {
        return jdbc.queryForList("SELECT eliminar_despues FROM vacantes_papelera WHERE vacante_id=?",Long.class,id);
    }

    public void remove(long id) {
        jdbc.update("DELETE FROM vacantes_papelera WHERE vacante_id=?",id);
    }

    public void pauseJob(long id) {
        jdbc.update("UPDATE vacantes SET estado='pausada',fecha_cierre=NULL WHERE id=?",id);
    }

    public Long lockForPurge() {
        return jdbc.queryForObject("SELECT id FROM roles WHERE nombre='RECLUTADOR' FOR UPDATE",Long.class);
    }

    public List<Long> expiredJobs(long now) {
        return jdbc.queryForList("SELECT vacante_id FROM vacantes_papelera WHERE eliminar_despues<=? ORDER BY vacante_id LIMIT 25",Long.class,now);
    }

    public List<Long> lockApplications(long id) {
        return jdbc.queryForList("SELECT id FROM postulaciones WHERE vacante_id=? FOR UPDATE",Long.class,id);
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

    public void auditPurge(long id) {
        jdbc.update("INSERT INTO auditoria(tabla_afectada,registro_id,accion,detalle) VALUES('vacantes',?,'eliminar','Eliminación automática tras 30 días; incluye postulaciones y documentos asociados')",id);
    }

    public void removePurged(long id) {
        jdbc.update("DELETE FROM vacantes_papelera WHERE vacante_id=?",id);
    }

    public void deleteJob(long id) {
        jdbc.update("DELETE FROM vacantes WHERE id=?",id);
    }
}
