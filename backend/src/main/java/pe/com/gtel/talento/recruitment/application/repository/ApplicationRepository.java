package pe.com.gtel.talento.recruitment.application.repository;

import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Repository;

@Repository
public class ApplicationRepository {
    private final JdbcTemplate jdbc;
    public ApplicationRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    private static final String VIEW="""
        SELECT po.id,po.codigo code,p.usuario_id userId,CONCAT(p.nombres,' ',p.apellidos) name,
        u.email,p.telefono phone,CASE WHEN p.tipo_documento='DNI' THEN p.numero_documento ELSE NULL END dni,COALESCE(c.localidad,'') location,v.titulo job,v.id jobId,
        d.nombre department,CAST(po.fecha_postulacion AS CHAR(30)) date,po.estado status,po.puntaje_general score,
        COALESCE(p.educacion,'') educationText,COALESCE(p.experiencia,'') experienceText
        FROM postulaciones po JOIN postulantes p ON p.id=po.postulante_id JOIN usuarios u ON u.id=p.usuario_id
        JOIN vacantes v ON v.id=po.vacante_id JOIN departamentos d ON d.id=v.departamento_id
        LEFT JOIN perfiles_contacto c ON c.usuario_id=u.id
        """;

    public List<Map<String,Object>> listAll() {
        return jdbc.queryForList(VIEW+" ORDER BY po.id DESC");
    }

    public List<Map<String,Object>> listByUser(long userId) {
        return jdbc.queryForList(VIEW+" WHERE p.usuario_id=? ORDER BY po.id DESC",userId);
    }

    public List<Map<String,Object>> timeline(Object id) {
        return jdbc.queryForList("SELECT estado_nuevo label,CAST(fecha_cambio AS CHAR(30)) date,TRUE done FROM postulacion_timeline WHERE postulacion_id=? ORDER BY id",id);
    }

    public List<Map<String,Object>> find(long id) {
        return jdbc.queryForList(VIEW+" WHERE po.id=?",id);
    }

    public List<Long> lockCandidate(long userId) {
        return jdbc.queryForList("SELECT id FROM postulantes WHERE usuario_id=? FOR UPDATE",Long.class,userId);
    }

    public List<Map<String,Object>> lockJob(long job) {
        return jdbc.queryForList("SELECT estado,fecha_limite_postulacion FROM vacantes WHERE id=? FOR UPDATE",job);
    }

    public Integer countByCandidateAndJob(long candidate,long job) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM postulaciones WHERE postulante_id=? AND vacante_id=?",Integer.class,candidate,job);
    }

    public long insert(String code,long candidate,long job) {
        var key = new GeneratedKeyHolder();
        jdbc.update(c->{var s=c.prepareStatement("INSERT INTO postulaciones(codigo,postulante_id,vacante_id) VALUES(?,?,?)",new String[]{"id"});s.setString(1,code);s.setLong(2,candidate);s.setLong(3,job);return s;},key);
        return key.getKey().longValue();
    }

    public void insertDocument(long id,byte[] bytes,String personalData) {
        jdbc.update("INSERT INTO documentos_postulacion(postulacion_id,nombre,contenido,datos_personales) VALUES(?,?,?,?)",id,"curriculum.pdf",bytes,personalData);
    }

    public void updateDocumentNumber(long candidate,String dni) {
        jdbc.update("UPDATE postulantes SET tipo_documento='DNI',numero_documento=? WHERE id=?",dni,candidate);
    }

    public List<byte[]> document(long id) {
        return jdbc.query("SELECT contenido FROM documentos_postulacion WHERE postulacion_id=?",(r,n)->r.getBytes(1),id);
    }

    public List<String> lockStatus(long id) {
        return jdbc.queryForList("SELECT estado FROM postulaciones WHERE id=? FOR UPDATE",String.class,id);
    }

    public void updateStatus(long id,String state) {
        jdbc.update("UPDATE postulaciones SET estado=? WHERE id=?",state,id);
    }

    public void insertTimeline(long id,String old,String state,long actor,String comment) {
        jdbc.update("INSERT INTO postulacion_timeline(postulacion_id,estado_anterior,estado_nuevo,comentario,usuario_id) VALUES(?,?,?,?,?)",id,old,state,comment,actor);
    }
}
