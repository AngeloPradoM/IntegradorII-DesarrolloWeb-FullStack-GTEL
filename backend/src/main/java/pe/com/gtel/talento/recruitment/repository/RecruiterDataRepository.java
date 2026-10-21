package pe.com.gtel.talento.recruitment.repository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class RecruiterDataRepository {

    private final JdbcTemplate jdbcTemplate;

    public RecruiterDataRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Map<String, Object>> candidates() {
        return jdbcTemplate.queryForList("""
                SELECT p.id, CONCAT(p.nombres, ' ', p.apellidos) AS name,
                       COALESCE(v.titulo, 'Sin vacante') AS job,
                       COALESCE(u.email, '') AS email,
                       COALESCE(p.telefono, '') AS phone,
                       COALESCE(p.dni, '') AS dni,
                       COALESCE(v.sede, 'Lima, Perú') AS location,
                       COALESCE(d.nombre, '') AS department,
                       COALESCE(po.cv_url, p.cv_url, '') AS cvUrl,
                       DATE_FORMAT(po.fecha_postulacion, '%d %b %Y') AS date,
                       po.estado AS status, po.puntaje_general AS score
                FROM postulantes p
                JOIN usuarios u ON u.id = p.usuario_id
                LEFT JOIN postulaciones po ON po.id = (
                    SELECT po2.id FROM postulaciones po2
                    WHERE po2.postulante_id = p.id
                    ORDER BY po2.fecha_postulacion DESC, po2.id DESC
                    LIMIT 1
                )
                LEFT JOIN vacantes v ON v.id = po.vacante_id
                LEFT JOIN departamentos d ON d.id = v.departamento_id
                ORDER BY po.fecha_postulacion DESC, p.id DESC
                """);
    }

    public List<Map<String, Object>> applications() {
        List<Map<String, Object>> raw = jdbcTemplate.queryForList("""
                SELECT po.id,
                       p.id AS candidateId,
                       CONCAT(p.nombres, ' ', p.apellidos) AS name,
                       COALESCE(u.email, '') AS email,
                       COALESCE(v.titulo, 'Sin vacante') AS job,
                       v.id AS jobId,
                       COALESCE(po.codigo, CONCAT('POST-', po.id)) AS code,
                       po.estado AS status,
                       COALESCE(po.puntaje_general, 0) AS score,
                       COALESCE(po.cv_url, p.cv_url, '') AS cvUrl,
                       COALESCE(po.cv_nombre, 'CV.pdf') AS cvNombre,
                       DATE_FORMAT(po.fecha_postulacion, '%d %b %Y') AS date,
                       COALESCE(p.educacion, 'Superior / Universitaria') AS educationText,
                       COALESCE(p.experiencia, 'Experiencia laboral relevante') AS experienceText
                FROM postulaciones po
                JOIN postulantes p ON p.id = po.postulante_id
                JOIN usuarios u ON u.id = p.usuario_id
                LEFT JOIN vacantes v ON v.id = po.vacante_id
                ORDER BY po.fecha_postulacion DESC, po.id DESC
                """);

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> row : raw) {
            Map<String, Object> app = new HashMap<>(row);
            Long appId = ((Number) app.get("id")).longValue();
            List<Map<String, Object>> steps = jdbcTemplate.queryForList("""
                    SELECT DATE_FORMAT(fecha_cambio, '%Y-%m-%d') AS date,
                           estado_nuevo AS label
                    FROM postulacion_timeline
                    WHERE postulacion_id = ?
                    ORDER BY fecha_cambio ASC, id ASC
                    """, appId);
            if (steps.isEmpty()) {
                String d = app.get("date") != null ? app.get("date").toString() : "";
                String st = app.get("status") != null ? app.get("status").toString() : "recibida";
                steps = List.of(Map.of("date", d, "label", st));
            }
            app.put("steps", steps);
            result.add(app);
        }
        return result;
    }

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

    public Map<String, Object> dashboard() {
        Number applicants = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM postulantes", Number.class);
        Number totalApplications = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM postulaciones", Number.class);
        Number interviews = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM entrevistas WHERE estado = 'programada'", Number.class);
        Number activeJobs = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM vacantes WHERE estado = 'activa'", Number.class);
        Number evaluations = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM evaluaciones", Number.class);
        Number avgAtsScore = jdbcTemplate.queryForObject("SELECT ROUND(COALESCE(AVG(puntaje_general), 0)) FROM postulaciones WHERE puntaje_general > 0", Number.class);
        Number timeToHire = jdbcTemplate.queryForObject("""
                SELECT ROUND(COALESCE(AVG(DATEDIFF(t.fecha_cambio, po.fecha_postulacion)), 12))
                FROM postulaciones po
                JOIN postulacion_timeline t ON t.postulacion_id = po.id
                WHERE t.estado_nuevo = 'aprobada'
                """, Number.class);

        // Conteo por etapas para el Embudo de Contratación (Funnel)
        Number countRecibida = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM postulaciones WHERE estado = 'recibida'", Number.class);
        Number countEnRevision = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM postulaciones WHERE estado = 'en_revision'", Number.class);
        Number countEntrevista = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM postulaciones WHERE estado = 'entrevista'", Number.class);
        Number countAprobada = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM postulaciones WHERE estado = 'aprobada'", Number.class);
        Number countRechazada = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM postulaciones WHERE estado = 'rechazada'", Number.class);

        int nTotal = totalApplications == null ? 0 : totalApplications.intValue();
        int nRecibida = countRecibida == null ? 0 : countRecibida.intValue();
        int nEnRevision = countEnRevision == null ? 0 : countEnRevision.intValue();
        int nEntrevista = countEntrevista == null ? 0 : countEntrevista.intValue();
        int nAprobada = countAprobada == null ? 0 : countAprobada.intValue();
        int nRechazada = countRechazada == null ? 0 : countRechazada.intValue();

        double conversionRate = nTotal > 0 ? Math.round(((double) nAprobada / nTotal * 100.0) * 10.0) / 10.0 : 0.0;
        double interviewRate = nTotal > 0 ? Math.round(((double) (nEntrevista + nAprobada) / nTotal * 100.0) * 10.0) / 10.0 : 0.0;

        List<Map<String, Object>> funnelStages = List.of(
                Map.of("key", "recibida", "name", "Recibidas", "count", nRecibida, "percentage", nTotal > 0 ? (int) Math.round((double) nRecibida / nTotal * 100) : 0),
                Map.of("key", "en_revision", "name", "En Revisión", "count", nEnRevision, "percentage", nTotal > 0 ? (int) Math.round((double) nEnRevision / nTotal * 100) : 0),
                Map.of("key", "entrevista", "name", "Entrevistas", "count", nEntrevista, "percentage", nTotal > 0 ? (int) Math.round((double) nEntrevista / nTotal * 100) : 0),
                Map.of("key", "aprobada", "name", "Aprobados", "count", nAprobada, "percentage", nTotal > 0 ? (int) Math.round((double) nAprobada / nTotal * 100) : 0),
                Map.of("key", "rechazada", "name", "Descartados", "count", nRechazada, "percentage", nTotal > 0 ? (int) Math.round((double) nRechazada / nTotal * 100) : 0)
        );

        Map<String, Object> funnel = Map.of(
                "total", nTotal,
                "conversionRate", conversionRate,
                "interviewRate", interviewRate,
                "stages", funnelStages
        );

        // Acciones rápidas (alertas operativas en vivo)
        Number pendingReviews = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM postulaciones WHERE estado IN ('recibida', 'en_revision')", Number.class);
        Number todayInterviews = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM entrevistas WHERE fecha = CURDATE() AND estado = 'programada'", Number.class);
        Number pendingEvaluations = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM postulaciones po
                WHERE po.estado = 'entrevista'
                  AND NOT EXISTS (SELECT 1 FROM evaluaciones ev WHERE ev.postulacion_id = po.id)
                """, Number.class);

        Map<String, Object> quickActions = Map.of(
                "pendingReviews", pendingReviews == null ? 0 : pendingReviews.intValue(),
                "todayInterviews", todayInterviews == null ? 0 : todayInterviews.intValue(),
                "pendingEvaluations", pendingEvaluations == null ? 0 : pendingEvaluations.intValue()
        );

        // Distribución de postulaciones por área / departamento técnico
        List<Map<String, Object>> applicationsByArea = jdbcTemplate.queryForList("""
                SELECT d.nombre AS name, COUNT(po.id) AS value
                FROM departamentos d
                LEFT JOIN vacantes v ON v.departamento_id = d.id
                LEFT JOIN postulaciones po ON po.vacante_id = v.id
                GROUP BY d.id, d.nombre
                HAVING value > 0
                ORDER BY value DESC
                """);

        if (applicationsByArea.isEmpty()) {
            applicationsByArea = jdbcTemplate.queryForList("""
                    SELECT d.nombre AS name, COUNT(v.id) AS value
                    FROM departamentos d
                    JOIN vacantes v ON v.departamento_id = d.id
                    GROUP BY d.id, d.nombre
                    ORDER BY value DESC
                    """);
        }

        // Tendencia mensual (últimos 6 meses)
        List<Map<String, Object>> monthlyTrends = jdbcTemplate.queryForList("""
                SELECT DATE_FORMAT(fecha_postulacion, '%b %Y') AS monthLabel,
                       DATE_FORMAT(fecha_postulacion, '%Y-%m') AS monthKey,
                       COUNT(*) AS count
                FROM postulaciones
                GROUP BY monthKey, monthLabel
                ORDER BY monthKey ASC
                """);

        // Candidatos destacados con mejor score ATS
        List<Map<String, Object>> topCandidates = jdbcTemplate.queryForList("""
                SELECT p.id, CONCAT(p.nombres, ' ', p.apellidos) AS name,
                       COALESCE(v.titulo, 'Sin vacante') AS job,
                       COALESCE(d.nombre, '') AS department,
                       po.estado AS status,
                       COALESCE(po.puntaje_general, 0) AS score,
                       COALESCE(po.cv_url, p.cv_url, '') AS cvUrl,
                       po.id AS applicationId
                FROM postulaciones po
                JOIN postulantes p ON p.id = po.postulante_id
                LEFT JOIN vacantes v ON v.id = po.vacante_id
                LEFT JOIN departamentos d ON d.id = v.departamento_id
                WHERE po.puntaje_general IS NOT NULL AND po.puntaje_general > 0
                ORDER BY po.puntaje_general DESC, po.fecha_postulacion DESC
                LIMIT 4
                """);

        // Últimas postulaciones con información completa
        List<Map<String, Object>> recentApplications = jdbcTemplate.queryForList("""
                SELECT po.id,
                       p.id AS candidateId,
                       CONCAT(p.nombres, ' ', p.apellidos) AS name,
                       COALESCE(v.titulo, 'Sin vacante') AS job,
                       DATE_FORMAT(po.fecha_postulacion, '%d %b %Y') AS date,
                       po.estado AS status,
                       COALESCE(po.puntaje_general, 0) AS score,
                       COALESCE(po.cv_url, p.cv_url, '') AS cvUrl,
                       COALESCE(po.cv_nombre, 'CV.pdf') AS cvNombre,
                       po.codigo AS code,
                       COALESCE(u.email, '') AS email
                FROM postulaciones po
                JOIN postulantes p ON p.id = po.postulante_id
                JOIN usuarios u ON u.id = p.usuario_id
                LEFT JOIN vacantes v ON v.id = po.vacante_id
                ORDER BY po.fecha_postulacion DESC
                LIMIT 8
                """);

        Map<String, Object> result = new HashMap<>();
        result.put("newApplicants", applicants == null ? 0 : applicants.intValue());
        result.put("totalApplications", nTotal);
        result.put("scheduledInterviews", interviews == null ? 0 : interviews.intValue());
        result.put("activeJobs", activeJobs == null ? 0 : activeJobs.intValue());
        result.put("evaluations", evaluations == null ? 0 : evaluations.intValue());
        result.put("averageAtsScore", avgAtsScore == null ? 0 : avgAtsScore.intValue());
        result.put("timeToHireDays", timeToHire == null ? 12 : timeToHire.intValue());
        result.put("funnel", funnel);
        result.put("quickActions", quickActions);
        result.put("applicationsByArea", applicationsByArea);
        result.put("monthlyTrends", monthlyTrends);
        result.put("topCandidates", topCandidates);
        result.put("recentApplications", recentApplications);

        return result;
    }
}
