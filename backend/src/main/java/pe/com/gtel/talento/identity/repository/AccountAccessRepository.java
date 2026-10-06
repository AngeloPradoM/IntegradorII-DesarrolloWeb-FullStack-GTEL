package pe.com.gtel.talento.identity.repository;

import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import pe.com.gtel.talento.identity.dto.AccountIdentity;

@Repository
public class AccountAccessRepository {
    private final JdbcTemplate jdbc;
    public AccountAccessRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    public List<AccountIdentity> find(String email) { return jdbc.query("""
            SELECT u.id,u.email,r.nombre,u.auth_version,u.otp_exempt,u.estado
            FROM usuarios u JOIN roles r ON r.id=u.rol_id WHERE LOWER(u.email)=LOWER(?)
            """,(r,n)->new AccountIdentity(r.getLong(1),r.getString(2),r.getString(3),r.getInt(4),r.getBoolean(5),r.getString(6)),email); }
}
