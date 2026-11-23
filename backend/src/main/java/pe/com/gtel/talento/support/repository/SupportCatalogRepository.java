package pe.com.gtel.talento.support.repository;

import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class SupportCatalogRepository {
    private final JdbcTemplate jdbc;

    public SupportCatalogRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public RequestType findActive(String code) {
        return jdbc.query("""
            SELECT codigo,nombre,descripcion,modulo_codigo,orden_visual
            FROM solicitud_tipos WHERE codigo=? AND activa=TRUE
            """, (rs,row) -> map(rs), code).stream().findFirst().orElse(null);
    }

    public List<RequestType> findAllActive() {
        return jdbc.query("""
            SELECT codigo,nombre,descripcion,modulo_codigo,orden_visual
            FROM solicitud_tipos WHERE activa=TRUE ORDER BY orden_visual,codigo
            """, (rs,row) -> map(rs));
    }

    private RequestType map(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new RequestType(rs.getString("codigo"),rs.getString("nombre"),
            rs.getString("descripcion"),rs.getString("modulo_codigo"),rs.getInt("orden_visual"));
    }

    public record RequestType(String code,String name,String description,String moduleCode,int displayOrder) {}
}
