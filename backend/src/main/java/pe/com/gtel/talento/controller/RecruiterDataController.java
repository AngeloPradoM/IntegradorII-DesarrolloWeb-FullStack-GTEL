package pe.com.gtel.talento.controller;

import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/recruiter")
public class RecruiterDataController {

    private final JdbcTemplate jdbcTemplate;

    public RecruiterDataController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/candidates")
    public List<Map<String, Object>> candidates() {
        return jdbcTemplate.queryForList("""
                SELECT p.id, CONCAT(p.nombres, ' ', p.apellidos) AS name,
                       COALESCE(v.titulo, 'Sin vacante') AS job,
                       DATE_FORMAT(po.fecha_postulacion, '%d %b %Y') AS date,
                       po.estado AS status, po.puntaje_general AS score
                FROM postulantes p
                LEFT JOIN postulaciones po ON po.postulante_id = p.id
                LEFT JOIN vacantes v ON v.id = po.vacante_id
                ORDER BY po.fecha_postulacion DESC, p.id DESC
                """);
    }

    @GetMapping("/interviews")
    public List<Map<String, Object>> interviews() {
        return jdbcTemplate.queryForList("""
                SELECT e.id, CONCAT(p.nombres, ' ', p.apellidos) AS name,
                       COALESCE(v.titulo, 'Sin vacante') AS job,
                       TIME_FORMAT(e.hora, '%H:%i') AS time,
                       CONCAT(e.duracion_min, ' min') AS duration,
                       e.tipo AS type, DAY(e.fecha) AS day, MONTH(e.fecha) - 1 AS month,
                       YEAR(e.fecha) AS year, e.ubicacion AS location
                FROM entrevistas e
                JOIN postulaciones po ON po.id = e.postulacion_id
                JOIN postulantes p ON p.id = po.postulante_id
                LEFT JOIN vacantes v ON v.id = po.vacante_id
                ORDER BY e.fecha, e.hora
                """);
    }

    @GetMapping("/evaluations")
    public List<Map<String, Object>> evaluations() {
        return jdbcTemplate.queryForList("""
                SELECT ev.id, CONCAT(p.nombres, ' ', p.apellidos) AS name,
                       COALESCE(v.titulo, 'Sin vacante') AS job,
                       ev.tipo_evaluacion AS test, ev.puntaje_total AS score,
                       CONCAT(COALESCE(ev.tiempo_min, 0), ' min') AS time,
                       DATE_FORMAT(ev.fecha_evaluacion, '%d %b %Y') AS date,
                       ev.resultado AS status
                FROM evaluaciones ev
                JOIN postulaciones po ON po.id = ev.postulacion_id
                JOIN postulantes p ON p.id = po.postulante_id
                LEFT JOIN vacantes v ON v.id = po.vacante_id
                ORDER BY ev.fecha_evaluacion DESC, ev.id DESC
                """);
    }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() {
        Number applicants = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM postulantes", Number.class);
        Number interviews = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM entrevistas WHERE estado = 'programada'", Number.class);
        Number activeJobs = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM vacantes WHERE estado = 'activa'", Number.class);
        return Map.of(
                "newApplicants", applicants == null ? 0 : applicants.intValue(),
                "scheduledInterviews", interviews == null ? 0 : interviews.intValue(),
                "activeJobs", activeJobs == null ? 0 : activeJobs.intValue(),
                "recentApplications", jdbcTemplate.queryForList("""
                        SELECT po.id, CONCAT(p.nombres, ' ', p.apellidos) AS name, po.estado AS status
                        FROM postulaciones po JOIN postulantes p ON p.id = po.postulante_id
                        ORDER BY po.fecha_postulacion DESC LIMIT 5
                        """),
                "applicationsByArea", jdbcTemplate.queryForList("""
                        SELECT d.nombre AS name, COUNT(*) AS value
                        FROM postulaciones po JOIN vacantes v ON v.id = po.vacante_id
                        JOIN departamentos d ON d.id = v.departamento_id
                        GROUP BY d.id, d.nombre ORDER BY value DESC
                        """),
                "quickActions", List.of());
    }
}
