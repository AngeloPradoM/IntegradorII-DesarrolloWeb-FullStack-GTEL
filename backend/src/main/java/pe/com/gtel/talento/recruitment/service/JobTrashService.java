package pe.com.gtel.talento.recruitment.service;

import java.time.Duration;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;

@Service
public class JobTrashService {
    private final JdbcTemplate jdbc;
    private final WorkflowIdentity identity;
    public JobTrashService(JdbcTemplate jdbc,WorkflowIdentity identity){this.jdbc=jdbc;this.identity=identity;}
    private void lock(long id){
        jdbc.queryForObject("SELECT id FROM roles WHERE nombre='RECLUTADOR' FOR UPDATE",Long.class);
        if(jdbc.queryForList("SELECT id FROM vacantes WHERE id=? FOR UPDATE",Long.class,id).isEmpty())throw new ResponseStatusException(NOT_FOUND,"Oferta no encontrada");
    }
    public List<Map<String,Object>> list(){return jdbc.queryForList("SELECT v.id,v.titulo title,p.eliminada_en deletedAt,p.eliminar_despues expiresAt FROM vacantes_papelera p JOIN vacantes v ON v.id=p.vacante_id ORDER BY p.eliminada_en DESC");}
    @Transactional public void trash(long id,String email){
        var actor=identity.actor(email);identity.recruiter(actor);lock(id);
        if(jdbc.queryForObject("SELECT COUNT(*) FROM vacantes_papelera WHERE vacante_id=?",Integer.class,id)>0)return;
        long now=System.currentTimeMillis();
        jdbc.update("INSERT INTO vacantes_papelera VALUES(?,?,?,?)",id,now,now+Duration.ofDays(30).toMillis(),actor.id());
        jdbc.update("UPDATE vacantes SET estado='cerrada',fecha_cierre=CURRENT_DATE WHERE id=?",id);
        identity.audit(actor,"vacantes",id,"actualizar","Oferta enviada a papelera por 30 días");
    }
    @Transactional public void restore(long id,String email){
        var actor=identity.actor(email);identity.recruiter(actor);lock(id);
        var expiry=jdbc.queryForList("SELECT eliminar_despues FROM vacantes_papelera WHERE vacante_id=?",Long.class,id);
        if(expiry.isEmpty())throw new ResponseStatusException(NOT_FOUND,"Oferta no disponible en papelera");
        if(expiry.getFirst()<=System.currentTimeMillis())throw new ResponseStatusException(CONFLICT,"El plazo de restauración venció");
        jdbc.update("DELETE FROM vacantes_papelera WHERE vacante_id=?",id);
        jdbc.update("UPDATE vacantes SET estado='pausada',fecha_cierre=NULL WHERE id=?",id);
        identity.audit(actor,"vacantes",id,"actualizar","Oferta restaurada como pausada");
    }
    @Transactional public void purgeExpired(){
        // Serialize with editing/restoration. Bounded batch; each run is atomic.
        jdbc.queryForObject("SELECT id FROM roles WHERE nombre='RECLUTADOR' FOR UPDATE",Long.class);
        var ids=jdbc.queryForList("SELECT vacante_id FROM vacantes_papelera WHERE eliminar_despues<=? ORDER BY vacante_id LIMIT 25",Long.class,System.currentTimeMillis());
        for(long id:ids){
            lock(id);
            var applications=jdbc.queryForList("SELECT id FROM postulaciones WHERE vacante_id=? FOR UPDATE",Long.class,id);
            for(long application:applications){
                jdbc.update("DELETE FROM evaluacion_detalle WHERE evaluacion_id IN (SELECT id FROM evaluaciones WHERE postulacion_id=?)",application);
                jdbc.update("DELETE FROM evaluaciones WHERE postulacion_id=?",application);
                jdbc.update("DELETE FROM entrevistas WHERE postulacion_id=?",application);
                jdbc.update("DELETE FROM postulacion_timeline WHERE postulacion_id=?",application);
                jdbc.update("DELETE FROM documentos_postulacion WHERE postulacion_id=?",application);
                jdbc.update("DELETE FROM postulaciones WHERE id=?",application);
            }
            jdbc.update("INSERT INTO auditoria(tabla_afectada,registro_id,accion,detalle) VALUES('vacantes',?,'eliminar','Eliminación automática tras 30 días; incluye postulaciones y documentos asociados')",id);
            jdbc.update("DELETE FROM vacantes_papelera WHERE vacante_id=?",id);
            jdbc.update("DELETE FROM vacantes WHERE id=?",id);
        }
    }
}
