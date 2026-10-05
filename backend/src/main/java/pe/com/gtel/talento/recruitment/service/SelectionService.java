package pe.com.gtel.talento.recruitment.service;

import java.util.*;
import java.time.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;

@Service
public class SelectionService {
    public record Interview(@Positive long applicationId,@NotNull LocalDate date,@NotNull LocalTime time,
        @Min(10) @Max(240) int minutes,@NotBlank @Pattern(regexp="video|presencial") String type,
        @NotBlank @Size(max=255) String location,@NotBlank @Pattern(regexp="programada|realizada|cancelada") String status) {}
    public record Criterion(@NotBlank @Size(max=100) String area,@Min(0) @Max(100) int score,@Size(max=255) String note) {}
    public record Evaluation(@Positive long applicationId,@NotBlank @Size(max=100) String test,
        @Min(0) @Max(1440) int minutes,@NotBlank @Pattern(regexp="aprobado|en_revision|no_aprobado") String status,
        @NotEmpty @Size(max=30) List<@Valid Criterion> details) {}
    private final JdbcTemplate jdbc;
    private final WorkflowIdentity identity;
    private final ApplicationService applications;
    private final NotificationService notifications;
    public SelectionService(JdbcTemplate jdbc,WorkflowIdentity identity,ApplicationService applications,NotificationService notifications){this.jdbc=jdbc;this.identity=identity;this.applications=applications;this.notifications=notifications;}
    public List<Map<String,Object>> interviews(){return jdbc.queryForList("""
        SELECT e.id,e.postulacion_id applicationId,CONCAT(p.nombres,' ',p.apellidos) name,v.titulo job,
        CAST(e.fecha AS CHAR(30)) date,CAST(e.hora AS CHAR(30)) time,e.duracion_min minutes,CONCAT(e.duracion_min,' min') duration,
        e.tipo type,e.ubicacion location,e.estado status
        FROM entrevistas e JOIN postulaciones po ON po.id=e.postulacion_id JOIN postulantes p ON p.id=po.postulante_id
        JOIN vacantes v ON v.id=po.vacante_id ORDER BY e.fecha,e.hora
        """);}
    @Transactional public Map<String,Object> interview(Long id,Interview r,String email){
        var actor=identity.actor(email);identity.recruiter(actor);
        jdbc.queryForObject("SELECT id FROM roles WHERE nombre='RECLUTADOR' FOR UPDATE",Long.class);
        var application=applications.get(r.applicationId(),email);
        if(id!=null&&jdbc.queryForObject("SELECT COUNT(*) FROM entrevistas WHERE id=? AND postulacion_id=?",Integer.class,id,r.applicationId())==0)throw new ResponseStatusException(NOT_FOUND);
        if(r.status().equals("programada")){
            if(LocalDateTime.of(r.date(),r.time()).isBefore(LocalDateTime.now()))throw new ResponseStatusException(BAD_REQUEST,"La entrevista debe programarse en el futuro");
            if(r.time().plusMinutes(r.minutes()).isBefore(r.time()))throw new ResponseStatusException(BAD_REQUEST,"La entrevista debe terminar el mismo día");
            // Shared recruiting agenda: conservatively reject any overlapping scheduled interview.
            var events=jdbc.queryForList("SELECT hora,duracion_min FROM entrevistas WHERE fecha=? AND estado='programada' AND id<>?",r.date(),id==null?-1:id);
            for(var event:events){var start=LocalTime.parse(event.get("hora").toString());var end=start.plusMinutes(((Number)event.get("duracion_min")).intValue());
                if(r.time().isBefore(end)&&r.time().plusMinutes(r.minutes()).isAfter(start))throw new ResponseStatusException(CONFLICT,"La agenda ya tiene una entrevista en ese horario");}
        }
        if(id==null){var key=new GeneratedKeyHolder();jdbc.update(c->{var s=c.prepareStatement("INSERT INTO entrevistas(postulacion_id,fecha,hora,tipo) VALUES(?,?,?,?)",new String[]{"id"});s.setLong(1,r.applicationId());s.setObject(2,r.date());s.setObject(3,r.time());s.setString(4,r.type());return s;},key);id=key.getKey().longValue();}
        jdbc.update("UPDATE entrevistas SET fecha=?,hora=?,duracion_min=?,tipo=?,ubicacion=?,estado=? WHERE id=?",r.date(),r.time(),r.minutes(),r.type(),r.location(),r.status(),id);
        identity.audit(actor,"entrevistas",id,"actualizar","Agenda: "+r.status());
        notifications.enqueue(((Number)application.get("userId")).longValue(),"Entrevista: "+r.status(),"Postulación "+application.get("code")+". Fecha: "+r.date()+" "+r.time()+". Modalidad: "+r.type()+". Lugar o enlace: "+r.location());
        final long selected=id;return interviews().stream().filter(x->((Number)x.get("id")).longValue()==selected).findFirst().orElseThrow();
    }
    public List<Map<String,Object>> evaluations(){
        var rows=jdbc.queryForList("""
            SELECT e.id,e.postulacion_id applicationId,e.postulacion_id candidateId,CONCAT(p.nombres,' ',p.apellidos) name,
            v.titulo job,e.tipo_evaluacion test,e.puntaje_total score,e.resultado status,e.tiempo_min minutes,
            CONCAT(e.tiempo_min,' min') time,CAST(e.fecha_evaluacion AS CHAR(30)) date,u.email evaluator
            FROM evaluaciones e JOIN postulaciones po ON po.id=e.postulacion_id JOIN postulantes p ON p.id=po.postulante_id
            JOIN vacantes v ON v.id=po.vacante_id LEFT JOIN usuarios u ON u.id=e.usuario_id ORDER BY e.id DESC
            """);
        for(var row:rows)row.put("details",jdbc.queryForList("SELECT criterio area,puntaje score,observacion note FROM evaluacion_detalle WHERE evaluacion_id=? ORDER BY id",row.get("id")));return rows;
    }
    @Transactional public Map<String,Object> evaluate(Evaluation r,String email){
        var actor=identity.actor(email);identity.recruiter(actor);applications.get(r.applicationId(),email);
        int score=(int)Math.round(r.details().stream().mapToInt(Criterion::score).average().orElseThrow());
        var key=new GeneratedKeyHolder();jdbc.update(c->{var s=c.prepareStatement("INSERT INTO evaluaciones(postulacion_id,tipo_evaluacion,puntaje_total,tiempo_min,resultado,usuario_id) VALUES(?,?,?,?,?,?)",new String[]{"id"});
            s.setLong(1,r.applicationId());s.setString(2,r.test());s.setInt(3,score);s.setInt(4,r.minutes());s.setString(5,r.status());s.setLong(6,actor.id());return s;},key);
        long id=key.getKey().longValue();for(var criterion:r.details())jdbc.update("INSERT INTO evaluacion_detalle(evaluacion_id,criterio,puntaje,observacion) VALUES(?,?,?,?)",id,criterion.area(),criterion.score(),criterion.note());
        jdbc.update("UPDATE postulaciones SET puntaje_general=? WHERE id=?",score,r.applicationId());
        identity.audit(actor,"evaluaciones",id,"crear","Evaluación registrada");
        return evaluations().stream().filter(x->((Number)x.get("id")).longValue()==id).findFirst().orElseThrow();
    }
}
