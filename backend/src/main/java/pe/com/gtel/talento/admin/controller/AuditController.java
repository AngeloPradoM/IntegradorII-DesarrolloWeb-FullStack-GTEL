package pe.com.gtel.talento.admin.controller;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
@RestController
@RequestMapping("/api/admin/audit")
public class AuditController {
    private final JdbcTemplate jdbc;
    public AuditController(JdbcTemplate jdbc){this.jdbc=jdbc;}
    @GetMapping public Map<String,Object> list(@RequestParam(defaultValue="0") int page){
        if(page<0||page>100000)throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        return Map.of("items",jdbc.queryForList("SELECT a.id,a.tabla_afectada entidad,a.registro_id registro,a.accion,a.detalle,a.fecha_accion fecha,COALESCE(u.email,a.actor_email_historico) actor FROM auditoria a LEFT JOIN usuarios u ON u.id=a.usuario_id ORDER BY a.id DESC LIMIT 25 OFFSET ?",page*25),"total",jdbc.queryForObject("SELECT COUNT(*) FROM auditoria",Long.class));
    }
}
