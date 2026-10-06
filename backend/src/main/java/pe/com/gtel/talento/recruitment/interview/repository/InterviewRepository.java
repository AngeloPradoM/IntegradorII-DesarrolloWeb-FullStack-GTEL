package pe.com.gtel.talento.recruitment.interview.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Repository;
import pe.com.gtel.talento.recruitment.interview.dto.InterviewRequest;

@Repository
public class InterviewRepository {
    private final JdbcTemplate jdbc;
    public InterviewRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public List<Map<String,Object>> interviews() {
        return jdbc.queryForList("""
        SELECT e.id,e.postulacion_id applicationId,CONCAT(p.nombres,' ',p.apellidos) name,v.titulo job,
        CAST(e.fecha AS CHAR(30)) date,CAST(e.hora AS CHAR(30)) time,e.duracion_min minutes,CONCAT(e.duracion_min,' min') duration,
        e.tipo type,e.ubicacion location,e.estado status
        FROM entrevistas e JOIN postulaciones po ON po.id=e.postulacion_id JOIN postulantes p ON p.id=po.postulante_id
        JOIN vacantes v ON v.id=po.vacante_id ORDER BY e.fecha,e.hora
        """);
    }

    public Long lockRecruiterRole() {
        return jdbc.queryForObject("SELECT id FROM roles WHERE nombre='RECLUTADOR' FOR UPDATE",Long.class);
    }

    public Integer countInterview(long id,long applicationId) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM entrevistas WHERE id=? AND postulacion_id=?",Integer.class,id,applicationId);
    }

    public List<Map<String,Object>> scheduledOn(LocalDate date,long excludedId) {
        return jdbc.queryForList("SELECT hora,duracion_min FROM entrevistas WHERE fecha=? AND estado='programada' AND id<>?",date,excludedId);
    }

    public long insertInterview(InterviewRequest r) {
        var key = new GeneratedKeyHolder();
        jdbc.update(c->{var s=c.prepareStatement("INSERT INTO entrevistas(postulacion_id,fecha,hora,tipo) VALUES(?,?,?,?)",new String[]{"id"});s.setLong(1,r.applicationId());s.setObject(2,r.date());s.setObject(3,r.time());s.setString(4,r.type());return s;},key);
        return key.getKey().longValue();
    }

    public void updateInterview(long id,InterviewRequest r) {
        jdbc.update("UPDATE entrevistas SET fecha=?,hora=?,duracion_min=?,tipo=?,ubicacion=?,estado=? WHERE id=?",r.date(),r.time(),r.minutes(),r.type(),r.location(),r.status(),id);
    }

}
