package pe.com.gtel.talento.auth.repository;

import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class OtpRepository {
    private final JdbcTemplate jdbc;
    public OtpRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public record Challenge(long userId, String sessionId, String email, String role, String hash,
            long expiresAt, long deadline, long resendAt, int attempts, int sends, boolean consumed) {}

    // One row per account bounds storage and serializes concurrent login/resend requests.
    public void lockUser(long id) {
        jdbc.queryForObject("SELECT id FROM usuarios WHERE id = ? FOR UPDATE", Long.class, id);
    }
    public Optional<Challenge> byUser(long id) {
        return find("usuario_id", id);
    }
    public Optional<Challenge> bySession(String id) {
        return find("session_id", id);
    }
    private Optional<Challenge> find(String column, Object value) {
        return jdbc.query("SELECT * FROM auth_email_challenges WHERE " + column + " = ? FOR UPDATE",
            (r, n) -> new Challenge(r.getLong("usuario_id"), r.getString("session_id"), r.getString("email"),
                r.getString("rol"), r.getString("code_hash"), r.getLong("expires_at"), r.getLong("deadline"),
                r.getLong("resend_at"), r.getInt("attempts"), r.getInt("sends"), r.getBoolean("consumed")), value)
            .stream().findFirst();
    }
    public void save(Challenge c) {
        jdbc.update("""
            INSERT INTO auth_email_challenges
            (usuario_id,session_id,email,rol,code_hash,expires_at,deadline,resend_at,attempts,sends,consumed)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)
            ON DUPLICATE KEY UPDATE session_id=VALUES(session_id),email=VALUES(email),rol=VALUES(rol),
            code_hash=VALUES(code_hash),expires_at=VALUES(expires_at),deadline=VALUES(deadline),
            resend_at=VALUES(resend_at),attempts=VALUES(attempts),sends=VALUES(sends),consumed=VALUES(consumed)
            """, c.userId(),c.sessionId(),c.email(),c.role(),c.hash(),c.expiresAt(),c.deadline(),
                c.resendAt(),c.attempts(),c.sends(),c.consumed());
    }
}
