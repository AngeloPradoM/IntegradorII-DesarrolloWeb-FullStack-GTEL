package pe.com.gtel.talento.recruitment.service;

import java.util.*;
import java.time.*;
import java.nio.charset.StandardCharsets;
import jakarta.validation.constraints.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class ApplicationService {
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown=true)
    public record Personal(@NotBlank @Size(max=100) String nombres,@NotBlank @Size(max=100) String apellidos,
        @NotBlank @Pattern(regexp="[0-9]{8}") String dni,
        @NotBlank @Pattern(regexp="\\+[1-9][0-9]{7,14}") String telefono,
        @NotBlank @Size(max=100) String distrito,@Size(max=3000) String motivacion) {}
    private final JdbcTemplate jdbc;
    private final WorkflowIdentity identity;
    private final NotificationService notifications;
    private final ObjectMapper json;
    public ApplicationService(JdbcTemplate jdbc,WorkflowIdentity identity,NotificationService notifications,ObjectMapper json){this.jdbc=jdbc;this.identity=identity;this.notifications=notifications;this.json=json;}
    private static final String VIEW="""
        SELECT po.id,po.codigo code,p.usuario_id userId,CONCAT(p.nombres,' ',p.apellidos) name,
        u.email,p.telefono phone,CASE WHEN p.tipo_documento='DNI' THEN p.numero_documento ELSE NULL END dni,COALESCE(c.localidad,'') location,v.titulo job,v.id jobId,
        d.nombre department,CAST(po.fecha_postulacion AS CHAR(30)) date,po.estado status,po.puntaje_general score,
        COALESCE(p.educacion,'') educationText,COALESCE(p.experiencia,'') experienceText
        FROM postulaciones po JOIN postulantes p ON p.id=po.postulante_id JOIN usuarios u ON u.id=p.usuario_id
        JOIN vacantes v ON v.id=po.vacante_id JOIN departamentos d ON d.id=v.departamento_id
        LEFT JOIN perfiles_contacto c ON c.usuario_id=u.id
        """;
    public List<Map<String,Object>> list(String email,boolean recruiter){
        var actor=identity.actor(email);if(recruiter)identity.recruiter(actor);
        var rows=recruiter?jdbc.queryForList(VIEW+" ORDER BY po.id DESC"):jdbc.queryForList(VIEW+" WHERE p.usuario_id=? ORDER BY po.id DESC",actor.id());
        for(var row:rows)row.put("steps",jdbc.queryForList("SELECT estado_nuevo label,CAST(fecha_cambio AS CHAR(30)) date,TRUE done FROM postulacion_timeline WHERE postulacion_id=? ORDER BY id",row.get("id")));
        return rows;
    }
    public Map<String,Object> get(long id,String email){
        var actor=identity.actor(email);var rows=jdbc.queryForList(VIEW+" WHERE po.id=?",id);
        if(rows.isEmpty())throw new ResponseStatusException(NOT_FOUND);
        var row=rows.getFirst();
        if(!actor.role().equals("ADMIN")&&!actor.role().equals("RECLUTADOR")&&((Number)row.get("userId")).longValue()!=actor.id())throw new ResponseStatusException(NOT_FOUND);
        return row;
    }
    @Transactional public Map<String,Object> apply(long job,Personal data,boolean terms,MultipartFile cv,String email) {
        var actor=identity.actor(email);
        if(!terms)throw new ResponseStatusException(BAD_REQUEST,"Debes aceptar las condiciones");
        byte[] bytes=pdf(cv);
        var profile=jdbc.queryForList("SELECT id FROM postulantes WHERE usuario_id=? FOR UPDATE",Long.class,actor.id());
        if(profile.isEmpty())throw new ResponseStatusException(BAD_REQUEST,"Se requiere una cuenta con perfil de candidato");
        long candidate=profile.getFirst();
        var jobs=jdbc.queryForList("SELECT estado,fecha_limite_postulacion FROM vacantes WHERE id=? FOR UPDATE",job);
        if(jobs.isEmpty())throw new ResponseStatusException(NOT_FOUND,"Oferta no encontrada");
        if(!"activa".equals(jobs.getFirst().get("estado")))throw new ResponseStatusException(CONFLICT,"La vacante no está abierta");
        var deadline=jobs.getFirst().get("fecha_limite_postulacion");
        if(deadline!=null&&LocalDate.parse(deadline.toString()).isBefore(LocalDate.now()))throw new ResponseStatusException(CONFLICT,"La convocatoria finalizó");
        if(jdbc.queryForObject("SELECT COUNT(*) FROM postulaciones WHERE postulante_id=? AND vacante_id=?",Integer.class,candidate,job)>0)throw new ResponseStatusException(CONFLICT,"Ya postulaste a esta oferta");
        var key=new GeneratedKeyHolder();String code="GTEL-"+UUID.randomUUID().toString().replace("-","").substring(0,24);
        jdbc.update(c->{var s=c.prepareStatement("INSERT INTO postulaciones(codigo,postulante_id,vacante_id) VALUES(?,?,?)",new String[]{"id"});s.setString(1,code);s.setLong(2,candidate);s.setLong(3,job);return s;},key);
        long id=key.getKey().longValue();
        try{jdbc.update("INSERT INTO documentos_postulacion(postulacion_id,nombre,contenido,datos_personales) VALUES(?,?,?,?)",id,"curriculum.pdf",bytes,json.writeValueAsString(data));}
        catch(com.fasterxml.jackson.core.JsonProcessingException e){throw new ResponseStatusException(BAD_REQUEST,"Datos inválidos");}
        jdbc.update("UPDATE postulantes SET tipo_documento='DNI',numero_documento=? WHERE id=?",data.dni(),candidate);
        timeline(id,null,"recibida",actor.id(),"Postulación registrada");
        identity.audit(actor,"postulaciones",id,"crear","Postulación con CV");
        notifications.enqueue(actor.id(),"Postulación recibida","Registramos tu postulación "+code+". Consulta su avance en Mis postulaciones.");
        return get(id,email);
    }
    static byte[] pdf(MultipartFile file){
        if(file==null||file.isEmpty()||file.getSize()>5*1024*1024)throw new ResponseStatusException(BAD_REQUEST,"Adjunta un PDF de hasta 5 MB");
        try{byte[] b=file.getBytes();String head=new String(b,0,Math.min(b.length,8),StandardCharsets.US_ASCII);
            String tail=new String(b,Math.max(0,b.length-1024),Math.min(1024,b.length),StandardCharsets.US_ASCII);
            if(!head.startsWith("%PDF-")||!tail.contains("%%EOF"))throw new ResponseStatusException(BAD_REQUEST,"El archivo no tiene estructura PDF válida");return b;
        }catch(java.io.IOException e){throw new ResponseStatusException(BAD_REQUEST,"No se pudo leer el PDF");}
    }
    public byte[] document(long id,String email){
        get(id,email);
        var docs=jdbc.query("SELECT contenido FROM documentos_postulacion WHERE postulacion_id=?",(r,n)->r.getBytes(1),id);
        if(docs.isEmpty())throw new ResponseStatusException(NOT_FOUND,"Esta postulación no tiene un CV almacenado");return docs.getFirst();
    }
    @Transactional public Map<String,Object> status(long id,String state,String email){
        var actor=identity.actor(email);identity.recruiter(actor);
        var old=jdbc.queryForList("SELECT estado FROM postulaciones WHERE id=? FOR UPDATE",String.class,id);
        if(old.isEmpty())throw new ResponseStatusException(NOT_FOUND);
        var allowed=Map.of("recibida",Set.of("en_revision","entrevista","rechazada"),"en_revision",Set.of("entrevista","aprobada","rechazada"),"entrevista",Set.of("en_revision","aprobada","rechazada"));
        if(old.getFirst().equals(state))return get(id,email);
        if(!allowed.getOrDefault(old.getFirst(),Set.of()).contains(state))throw new ResponseStatusException(CONFLICT,"Transición no permitida desde "+old.getFirst());
        jdbc.update("UPDATE postulaciones SET estado=? WHERE id=?",state,id);
        timeline(id,old.getFirst(),state,actor.id(),"Actualización por reclutamiento");
        identity.audit(actor,"postulaciones",id,"actualizar","Estado: "+old.getFirst()+" → "+state);
        var result=get(id,email);notifications.enqueue(((Number)result.get("userId")).longValue(),"Estado de postulación","Tu postulación "+result.get("code")+" cambió a "+state+".");return result;
    }
    private void timeline(long id,String old,String state,long actor,String comment){jdbc.update("INSERT INTO postulacion_timeline(postulacion_id,estado_anterior,estado_nuevo,comentario,usuario_id) VALUES(?,?,?,?,?)",id,old,state,comment,actor);}
}
