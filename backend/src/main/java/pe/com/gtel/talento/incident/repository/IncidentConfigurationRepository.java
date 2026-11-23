package pe.com.gtel.talento.incident.repository;

import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class IncidentConfigurationRepository {
    private final JdbcTemplate jdbc;

    public IncidentConfigurationRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public CategoryConfiguration categoryForModule(String moduleCode) {
        return jdbc.query("""
            SELECT codigo,nombre,modulo_codigo
            FROM incidente_categorias
            WHERE modulo_codigo=? AND activa=TRUE
            """, (rs, row) -> new CategoryConfiguration(
                rs.getString("codigo"), rs.getString("nombre"), rs.getString("modulo_codigo")),
            moduleCode).stream().findFirst().orElse(null);
    }

    public CategoryConfiguration categoryByCode(String categoryCode) {
        return jdbc.query("""
            SELECT codigo,nombre,modulo_codigo
            FROM incidente_categorias
            WHERE codigo=? AND activa=TRUE
            """, (rs, row) -> new CategoryConfiguration(
                rs.getString("codigo"), rs.getString("nombre"), rs.getString("modulo_codigo")),
            categoryCode).stream().findFirst().orElse(null);
    }

    public List<CategoryConfiguration> activeCategories() {
        return jdbc.query("""
            SELECT codigo,nombre,modulo_codigo
            FROM incidente_categorias WHERE activa=TRUE ORDER BY nombre,codigo
            """, (rs, row) -> new CategoryConfiguration(
                rs.getString("codigo"), rs.getString("nombre"), rs.getString("modulo_codigo")));
    }

    public ProblemTypeConfiguration problemTypeByCode(String code) {
        return jdbc.query("""
            SELECT codigo,categoria_codigo,nombre,descripcion,orden_visual
            FROM incidente_tipos_problema WHERE codigo=? AND activa=TRUE
            """, (rs,row) -> new ProblemTypeConfiguration(rs.getString("codigo"),
                rs.getString("categoria_codigo"),rs.getString("nombre"),
                rs.getString("descripcion"),rs.getInt("orden_visual")), code)
            .stream().findFirst().orElse(null);
    }

    public List<ProblemTypeConfiguration> activeProblemTypes() {
        return jdbc.query("""
            SELECT codigo,categoria_codigo,nombre,descripcion,orden_visual
            FROM incidente_tipos_problema WHERE activa=TRUE
            ORDER BY categoria_codigo,orden_visual,codigo
            """, (rs,row) -> new ProblemTypeConfiguration(rs.getString("codigo"),
                rs.getString("categoria_codigo"),rs.getString("nombre"),
                rs.getString("descripcion"),rs.getInt("orden_visual")));
    }

    public SlaConfiguration slaForPriority(String priority) {
        return jdbc.query("""
            SELECT id,prioridad,minutos_primera_atencion,minutos_resolucion
            FROM incidente_sla_politicas
            WHERE prioridad=? AND activa=TRUE
            """, (rs, row) -> new SlaConfiguration(rs.getLong("id"), rs.getString("prioridad"),
                rs.getInt("minutos_primera_atencion"), rs.getInt("minutos_resolucion")),
            priority).stream().findFirst().orElse(null);
    }

    public List<SlaConfiguration> activeSlaPolicies() {
        return jdbc.query("""
            SELECT id,prioridad,minutos_primera_atencion,minutos_resolucion
            FROM incidente_sla_politicas WHERE activa=TRUE ORDER BY FIELD(prioridad,'P1','P2','P3','P4')
            """, (rs, row) -> new SlaConfiguration(rs.getLong("id"), rs.getString("prioridad"),
                rs.getInt("minutos_primera_atencion"), rs.getInt("minutos_resolucion")));
    }

    public AssignmentCandidate assignmentCandidate(String categoryCode, String priority) {
        List<AssignmentCandidate> candidates = jdbc.query("""
            SELECT ar.id regla_id,u.id tecnico_id,u.email,ar.precedencia,COUNT(i.id) carga_activa
            FROM incidente_asignacion_reglas ar
            JOIN usuarios u ON u.id=ar.tecnico_id AND u.estado='activo'
            JOIN roles rol ON rol.id=u.rol_id AND rol.nombre='TECNICO'
            LEFT JOIN incidentes_produccion i ON i.responsable_id=u.id
              AND i.estado NOT IN ('VERIFICADO','CERRADO')
            WHERE ar.categoria_codigo=? AND ar.activa=TRUE
              AND (ar.prioridad=? OR ar.prioridad IS NULL)
              AND (ar.vigencia_desde IS NULL OR ar.vigencia_desde<=CURRENT_TIMESTAMP)
              AND (ar.vigencia_hasta IS NULL OR ar.vigencia_hasta>CURRENT_TIMESTAMP)
            GROUP BY ar.id,u.id,u.email,ar.precedencia,ar.prioridad
            ORDER BY CASE WHEN ar.prioridad=? THEN 0 ELSE 1 END,
              ar.precedencia,COUNT(i.id),u.id
            LIMIT 1
            """, (rs, row) -> new AssignmentCandidate(rs.getLong("regla_id"),
                rs.getLong("tecnico_id"), rs.getString("email"), rs.getInt("precedencia"),
                rs.getLong("carga_activa")), categoryCode, priority, priority);
        return candidates.stream().findFirst().orElse(null);
    }

    public boolean activeOperationalUserExists(long userId) {
        Long count = jdbc.queryForObject("""
            SELECT COUNT(*) FROM usuarios u JOIN roles r ON r.id=u.rol_id
            WHERE u.id=? AND u.estado='activo' AND r.nombre IN ('ADMIN','TECNICO')
            """, Long.class, userId);
        return count != null && count > 0;
    }

    public record CategoryConfiguration(String code, String name, String moduleCode) {}
    public record ProblemTypeConfiguration(String code,String categoryCode,String name,
                                           String description,int displayOrder) {}
    public record SlaConfiguration(long id, String priority, int firstAttentionMinutes, int resolutionMinutes) {}
    public record AssignmentCandidate(long ruleId, long technicianId, String email,
                                      int precedence, long activeIncidentCount) {}
}
