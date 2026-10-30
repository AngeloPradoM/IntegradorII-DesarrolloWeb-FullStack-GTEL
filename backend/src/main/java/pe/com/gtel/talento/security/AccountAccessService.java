package pe.com.gtel.talento.security;

import java.util.Locale;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AccountAccessService {
    private final JdbcTemplate jdbc;
    private final boolean testAccess;
    private static final Map<String,String> TEST_ROLES = Map.of(
        "administrador@gmail.com","ADMIN",
        "postulante1@gmail.com","CANDIDATO",
        "reclutador1@gmail.com","RECLUTADOR",
        "tecnico1@gmail.com","TECNICO");
    public AccountAccessService(JdbcTemplate jdbc, @Value("${TEST_ACCESS_ENABLED:false}") boolean testAccess) {
        this.jdbc=jdbc; this.testAccess=testAccess;
    }
    public record Account(long id,String email,String role,int version,boolean exempt,String status) {}
    public Account find(String email) {
        return jdbc.query("""
            SELECT u.id,u.email,r.nombre,u.auth_version,u.otp_exempt,u.estado
            FROM usuarios u JOIN roles r ON r.id=u.rol_id WHERE LOWER(u.email)=LOWER(?)
            """,(r,n)->new Account(r.getLong(1),r.getString(2),r.getString(3),r.getInt(4),r.getBoolean(5),r.getString(6)),email)
            .stream().findFirst().orElseThrow(()->new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Cuenta no disponible"));
    }
    public boolean bypass(Account a) {
        String email = a.email().toLowerCase(Locale.ROOT);
        String expectedRole = TEST_ROLES.get(email);
        if (expectedRole == null) return false;
        boolean roleMatches = a.role().equalsIgnoreCase(expectedRole)
            || (expectedRole.startsWith("JEFATURA") && a.role().toUpperCase(Locale.ROOT).startsWith("JEFATURA"))
            || (expectedRole.startsWith("ANALISTA") && a.role().toUpperCase(Locale.ROOT).startsWith("ANALISTA"));
        return testAccess && a.exempt() && "activo".equals(a.status()) && roleMatches;
    }
    public void validate(String token, JwtService jwt) {
        var a=find(jwt.getEmail(token));
        if (!"activo".equals(a.status()) || !a.role().equals(jwt.getRole(token)) || a.version()!=jwt.getVersion(token)
            || ("TEST_PASSWORD".equals(jwt.getMethod(token)) && !bypass(a)))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"La sesión cambió. Inicia sesión nuevamente.");
    }
}
