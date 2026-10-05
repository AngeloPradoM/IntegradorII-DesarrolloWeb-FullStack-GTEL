package pe.com.gtel.talento.recruitment.service;

import java.util.*;
import java.time.LocalDate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;
import pe.com.gtel.talento.recruitment.dto.JobRequest;

@Service
public class JobService {
    private final JdbcTemplate jdbc;
    private final WorkflowIdentity identity;
    public JobService(JdbcTemplate jdbc, WorkflowIdentity identity) {this.jdbc=jdbc;this.identity=identity;}
    private static final String VIEW="""
        SELECT v.id,v.titulo title,v.descripcion description,d.nombre department,v.sede location,
        v.tipo_jornada type,v.modalidad modality,v.sueldo_min salaryMin,v.sueldo_max salaryMax,
        CONCAT('S/ ',v.sueldo_min,' - S/ ',v.sueldo_max) salary,v.num_vacantes vacancies,
        v.estado status,CAST(v.fecha_publicacion AS CHAR(30)) date,
        CAST(v.fecha_limite_postulacion AS CHAR(30)) deadline,
        v.nivel_educativo education,v.experiencia_minima experience,v.habilidades tagsText
        FROM vacantes v JOIN departamentos d ON d.id=v.departamento_id
        """;
    public List<Map<String,Object>> list(boolean publicOnly) {
        var rows=jdbc.queryForList(VIEW+" WHERE NOT EXISTS (SELECT 1 FROM vacantes_papelera p WHERE p.vacante_id=v.id)"+(publicOnly?" AND v.estado='activa' AND (v.fecha_limite_postulacion IS NULL OR v.fecha_limite_postulacion>=CURRENT_DATE)":"")+" ORDER BY v.id DESC");
        rows.forEach(this::tags);return rows;
    }
    public Map<String,Object> get(long id, boolean publicOnly) {
        var rows=jdbc.queryForList(VIEW+" WHERE v.id=? AND NOT EXISTS (SELECT 1 FROM vacantes_papelera p WHERE p.vacante_id=v.id)"+(publicOnly?" AND v.estado='activa' AND (v.fecha_limite_postulacion IS NULL OR v.fecha_limite_postulacion>=CURRENT_DATE)":""),id);
        if(rows.isEmpty())throw new ResponseStatusException(NOT_FOUND,"Oferta no disponible");
        tags(rows.getFirst());return rows.getFirst();
    }
    private void tags(Map<String,Object> row){var value=row.remove("tagsText");row.put("tags",value==null||value.toString().isBlank()?List.of():Arrays.asList(value.toString().split(",")));}
    @Transactional public Map<String,Object> save(Long id,JobRequest r,String email) {
        var actor=identity.actor(email);identity.recruiter(actor);
        String skills=r.tags()==null?"":String.join(",",r.tags());
        if(skills.length()>255)throw new ResponseStatusException(BAD_REQUEST,"Las habilidades no deben superar 255 caracteres");
        if(r.salaryMin().compareTo(r.salaryMax())>0)throw new ResponseStatusException(BAD_REQUEST,"El sueldo máximo debe ser mayor o igual al mínimo");
        if(r.deadline()!=null&&r.deadline().isBefore(LocalDate.now())&&!r.status().equals("cerrada"))
            throw new ResponseStatusException(BAD_REQUEST,"La fecha límite no puede estar en el pasado");
        // Serializes department creation and job edits without changing existing departments.
        jdbc.queryForObject("SELECT id FROM roles WHERE nombre='RECLUTADOR' FOR UPDATE",Long.class);
        var departments=jdbc.queryForList("SELECT id FROM departamentos WHERE nombre=?",Long.class,r.department().trim());
        if(departments.isEmpty())jdbc.update("INSERT INTO departamentos(nombre) VALUES(?)",r.department().trim());
        long department=jdbc.queryForObject("SELECT id FROM departamentos WHERE nombre=?",Long.class,r.department().trim());
        if(id==null){
            var key=new GeneratedKeyHolder();
            jdbc.update(c->{var s=c.prepareStatement("INSERT INTO vacantes(titulo,departamento_id,reclutador_id,tipo_jornada,modalidad) VALUES(?,?,?,?,?)",new String[]{"id"});
                s.setString(1,r.title().trim());s.setLong(2,department);s.setLong(3,actor.id());s.setString(4,r.type());s.setString(5,r.modality());return s;},key);
            id=key.getKey().longValue();
            identity.audit(actor,"vacantes",id,"crear","Creación de vacante");
        }else{
            get(id,false);
            identity.audit(actor,"vacantes",id,"actualizar","Edición de vacante; estado: "+r.status());
        }
        jdbc.update("""
            UPDATE vacantes SET titulo=?,descripcion=?,departamento_id=?,sede=?,tipo_jornada=?,modalidad=?,
            sueldo_min=?,sueldo_max=?,num_vacantes=?,estado=?,fecha_limite_postulacion=?,fecha_cierre=? WHERE id=?
            """,r.title().trim(),r.description().trim(),department,r.location().trim(),r.type(),r.modality(),r.salaryMin(),r.salaryMax(),r.vacancies(),r.status(),r.deadline(),r.status().equals("cerrada")?LocalDate.now():null,id);
        jdbc.update("UPDATE vacantes SET nivel_educativo=?,experiencia_minima=?,habilidades=? WHERE id=?",r.education(),r.experience(),skills,id);
        return get(id,false);
    }
}
