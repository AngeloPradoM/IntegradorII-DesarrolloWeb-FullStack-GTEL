package pe.com.gtel.talento.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Explicit opt-in local fixture accounts. Never reset existing passwords on startup. */
@Component
@ConditionalOnProperty(name="app.security.test-access-enabled",havingValue="true")
public class DevelopmentAccounts implements CommandLineRunner {
    private final JdbcTemplate jdbc;
    private final PasswordEncoder encoder;
    public DevelopmentAccounts(JdbcTemplate jdbc,PasswordEncoder encoder){this.jdbc=jdbc;this.encoder=encoder;}
    @Override @Transactional public void run(String... args) {
        seed("administrador@gmail.com","AdminSecure2026*","ADMIN");
        seed("postulante1@gmail.com","Postulante2026!","CANDIDATO");
        seed("reclutador1@gmail.com","Reclutador2026!","RECLUTADOR");
    }
    private void seed(String email,String password,String role) {
        Long roleId=jdbc.queryForObject("SELECT id FROM roles WHERE nombre=?",Long.class,role);
        var rows=jdbc.queryForList("SELECT id,password_hash,rol_id FROM usuarios WHERE LOWER(email)=? FOR UPDATE",email);
        if(rows.isEmpty()){
            // Respect an explicit administrative deletion, including after restart.
            if(jdbc.queryForObject("SELECT COUNT(*) FROM auditoria WHERE tabla_afectada='usuarios' AND accion='eliminar' AND detalle=?",Long.class,"Eliminación definitiva de cuenta: "+email)>0)return;
            jdbc.update("INSERT INTO usuarios(email,password_hash,rol_id,estado,otp_exempt) VALUES(?,?,?,'activo',TRUE)",email,encoder.encode(password),roleId);
        } else {
            var old=rows.getFirst();
            if(((Number)old.get("rol_id")).longValue()!=roleId || !encoder.matches(password,(String)old.get("password_hash")))
                return; // An existing unrelated account is never promoted or reset silently.
            jdbc.update("UPDATE usuarios SET otp_exempt=TRUE WHERE id=?",old.get("id"));
        }
        if("CANDIDATO".equals(role)){
            Long id=jdbc.queryForObject("SELECT id FROM usuarios WHERE LOWER(email)=?",Long.class,email);
            if(jdbc.queryForObject("SELECT COUNT(*) FROM postulantes WHERE usuario_id=?",Long.class,id)==0)
                jdbc.update("INSERT INTO postulantes(usuario_id,nombres,apellidos) VALUES(?,'Postulante','De Prueba')",id);
        }
    }
}
