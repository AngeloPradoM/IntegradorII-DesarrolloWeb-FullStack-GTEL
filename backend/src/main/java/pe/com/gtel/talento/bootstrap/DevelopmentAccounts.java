package pe.com.gtel.talento.bootstrap;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import pe.com.gtel.talento.bootstrap.repository.DevelopmentAccountRepository;

/** Explicit opt-in local fixture accounts. Never reset existing passwords on startup. */
@Component
@ConditionalOnProperty(name="app.security.test-access-enabled",havingValue="true")
public class DevelopmentAccounts implements CommandLineRunner {
    private final DevelopmentAccountRepository repository;
    private final PasswordEncoder encoder;
    public DevelopmentAccounts(DevelopmentAccountRepository repository,PasswordEncoder encoder){this.repository=repository;this.encoder=encoder;}
    @Override @Transactional public void run(String... args) {
        seed("administrador@gmail.com","AdminSecure2026*","ADMIN");
        seed("postulante1@gmail.com","Postulante2026!","CANDIDATO");
        seed("reclutador1@gmail.com","Reclutador2026!","RECLUTADOR");
    }
    private void seed(String email,String password,String role) {
        Long roleId=repository.roleId(role);
        var rows=repository.lockByEmail(email);
        if(rows.isEmpty()){
            // Respect an explicit administrative deletion, including after restart.
            if(repository.deletedCount(email)>0)return;
            repository.insert(email,encoder.encode(password),roleId);
        } else {
            var old=rows.getFirst();
            if(((Number)old.get("rol_id")).longValue()!=roleId || !encoder.matches(password,(String)old.get("password_hash")))
                return; // An existing unrelated account is never promoted or reset silently.
            repository.markExempt(old.get("id"));
        }
        if("CANDIDATO".equals(role)){
            Long id=repository.userId(email);
            if(repository.profileCount(id)==0)
                repository.insertProfile(id);
        }
    }
}
