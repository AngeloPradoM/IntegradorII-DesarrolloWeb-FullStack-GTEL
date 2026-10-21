package pe.com.gtel.talento.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Cuentas de prueba preconfiguradas para entorno local / desarrollo.
 * Garantiza que las 6 credenciales de prueba tengan su clave oficial y otp_exempt=TRUE
 * para ingresar directamente sin requerir código OTP.
 */
@Component
@ConditionalOnProperty(name="app.security.test-access-enabled",havingValue="true")
public class DevelopmentAccounts implements CommandLineRunner {
    private final JdbcTemplate jdbc;
    private final PasswordEncoder encoder;

    public DevelopmentAccounts(JdbcTemplate jdbc, PasswordEncoder encoder) {
        this.jdbc = jdbc;
        this.encoder = encoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        seed("administrador@gmail.com", "AdminSecure2026*", "ADMIN");
        seed("postulante1@gmail.com", "Postulante2026!", "CANDIDATO");
        seed("reclutador1@gmail.com", "Reclutador2026!", "RECLUTADOR");
        seed("jefatura1@gmail.com", "Password123!", "JEFATURA_SOLICITANTE");
        seed("analista1@gmail.com", "Password123!", "ANALISTA_RRHH");
        seed("entrevistador1@gmail.com", "Password123!", "ENTREVISTADOR");
    }

    private void seed(String email, String password, String role) {
        var roleRows = jdbc.queryForList("SELECT id FROM roles WHERE nombre=? OR nombre LIKE ?", Long.class, role, role + "%");
        if (roleRows.isEmpty()) return;
        Long roleId = roleRows.getFirst();

        var rows = jdbc.queryForList("SELECT id, password_hash, rol_id FROM usuarios WHERE LOWER(email)=? FOR UPDATE", email);
        if (rows.isEmpty()) {
            jdbc.update("INSERT INTO usuarios(email, password_hash, rol_id, estado, otp_exempt) VALUES(?, ?, ?, 'activo', TRUE)",
                email, encoder.encode(password), roleId);
        } else {
            var old = rows.getFirst();
            jdbc.update("UPDATE usuarios SET password_hash=?, rol_id=?, estado='activo', otp_exempt=TRUE WHERE id=?",
                encoder.encode(password), roleId, old.get("id"));
        }

        if ("CANDIDATO".equalsIgnoreCase(role)) {
            Long id = jdbc.queryForObject("SELECT id FROM usuarios WHERE LOWER(email)=?", Long.class, email);
            if (jdbc.queryForObject("SELECT COUNT(*) FROM postulantes WHERE usuario_id=?", Long.class, id) == 0) {
                jdbc.update("INSERT INTO postulantes(usuario_id, nombres, apellidos) VALUES(?, 'Postulante', 'De Prueba')", id);
            }
        }
    }
}
