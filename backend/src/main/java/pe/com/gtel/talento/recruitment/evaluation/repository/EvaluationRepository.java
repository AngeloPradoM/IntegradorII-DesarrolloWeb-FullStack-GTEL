package pe.com.gtel.talento.recruitment.evaluation.repository;

import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Repository;
import pe.com.gtel.talento.recruitment.evaluation.dto.EvaluationCriterionRequest;
import pe.com.gtel.talento.recruitment.evaluation.dto.EvaluationRequest;

@Repository
public class EvaluationRepository {
    private final JdbcTemplate jdbc;
    public EvaluationRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public List<Map<String,Object>> evaluations() {
        return jdbc.queryForList("""
            SELECT e.id,e.postulacion_id applicationId,e.postulacion_id candidateId,CONCAT(p.nombres,' ',p.apellidos) name,
            v.titulo job,e.tipo_evaluacion test,e.puntaje_total score,e.resultado status,e.tiempo_min minutes,
            CONCAT(e.tiempo_min,' min') time,CAST(e.fecha_evaluacion AS CHAR(30)) date,u.email evaluator
            FROM evaluaciones e JOIN postulaciones po ON po.id=e.postulacion_id JOIN postulantes p ON p.id=po.postulante_id
            JOIN vacantes v ON v.id=po.vacante_id LEFT JOIN usuarios u ON u.id=e.usuario_id ORDER BY e.id DESC
            """);
    }

    public List<Map<String,Object>> criteria(Object id) {
        return jdbc.queryForList("SELECT criterio area,puntaje score,observacion note FROM evaluacion_detalle WHERE evaluacion_id=? ORDER BY id",id);
    }

    public long insertEvaluation(EvaluationRequest r,int score,long actorId) {
        var key = new GeneratedKeyHolder();
        jdbc.update(c->{var s=c.prepareStatement("INSERT INTO evaluaciones(postulacion_id,tipo_evaluacion,puntaje_total,tiempo_min,resultado,usuario_id) VALUES(?,?,?,?,?,?)",new String[]{"id"});
            s.setLong(1,r.applicationId());s.setString(2,r.test());s.setInt(3,score);s.setInt(4,r.minutes());s.setString(5,r.status());s.setLong(6,actorId);return s;},key);
        return key.getKey().longValue();
    }

    public void insertCriterion(long id,EvaluationCriterionRequest criterion) {
        jdbc.update("INSERT INTO evaluacion_detalle(evaluacion_id,criterio,puntaje,observacion) VALUES(?,?,?,?)",id,criterion.area(),criterion.score(),criterion.note());
    }

    public void updateScore(long applicationId,int score) {
        jdbc.update("UPDATE postulaciones SET puntaje_general=? WHERE id=?",score,applicationId);
    }
}
