package pe.com.gtel.talento.recruitment.job.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Repository;
import pe.com.gtel.talento.recruitment.job.dto.JobRequest;

@Repository
public class JobRepository {
    private final JdbcTemplate jdbc;
    public JobRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }
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
        return jdbc.queryForList(VIEW+" WHERE NOT EXISTS (SELECT 1 FROM vacantes_papelera p WHERE p.vacante_id=v.id)"+(publicOnly?" AND v.estado='activa' AND (v.fecha_limite_postulacion IS NULL OR v.fecha_limite_postulacion>=CURRENT_DATE)":"")+" ORDER BY v.id DESC");
    }

    public List<Map<String,Object>> find(long id, boolean publicOnly) {
        return jdbc.queryForList(VIEW+" WHERE v.id=? AND NOT EXISTS (SELECT 1 FROM vacantes_papelera p WHERE p.vacante_id=v.id)"+(publicOnly?" AND v.estado='activa' AND (v.fecha_limite_postulacion IS NULL OR v.fecha_limite_postulacion>=CURRENT_DATE)":""),id);
    }

    public Long lockRecruiterRole() {
        return jdbc.queryForObject("SELECT id FROM roles WHERE nombre='RECLUTADOR' FOR UPDATE",Long.class);
    }

    public List<Long> findDepartment(String name) {
        return jdbc.queryForList("SELECT id FROM departamentos WHERE nombre=?",Long.class,name);
    }

    public void insertDepartment(String name) {
        jdbc.update("INSERT INTO departamentos(nombre) VALUES(?)",name);
    }

    public Long departmentId(String name) {
        return jdbc.queryForObject("SELECT id FROM departamentos WHERE nombre=?",Long.class,name);
    }

    public long insert(JobRequest r,long department,long actorId) {
        var key = new GeneratedKeyHolder();
        jdbc.update(c->{var s=c.prepareStatement("INSERT INTO vacantes(titulo,departamento_id,reclutador_id,tipo_jornada,modalidad) VALUES(?,?,?,?,?)",new String[]{"id"});
                s.setString(1,r.title().trim());s.setLong(2,department);s.setLong(3,actorId);s.setString(4,r.type());s.setString(5,r.modality());return s;},key);
        return key.getKey().longValue();
    }

    public void update(long id,JobRequest r,long department) {
        jdbc.update("""
            UPDATE vacantes SET titulo=?,descripcion=?,departamento_id=?,sede=?,tipo_jornada=?,modalidad=?,
            sueldo_min=?,sueldo_max=?,num_vacantes=?,estado=?,fecha_limite_postulacion=?,fecha_cierre=? WHERE id=?
            """,r.title().trim(),r.description().trim(),department,r.location().trim(),r.type(),r.modality(),r.salaryMin(),r.salaryMax(),r.vacancies(),r.status(),r.deadline(),r.status().equals("cerrada")?LocalDate.now():null,id);
    }

    public void updateRequirements(long id,JobRequest r,String skills) {
        jdbc.update("UPDATE vacantes SET nivel_educativo=?,experiencia_minima=?,habilidades=? WHERE id=?",r.education(),r.experience(),skills,id);
    }
}
