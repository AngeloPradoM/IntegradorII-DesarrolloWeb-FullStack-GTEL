package pe.com.gtel.talento.security;

import java.util.Locale;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import pe.com.gtel.talento.identity.dto.AccountIdentity;
import pe.com.gtel.talento.identity.repository.AccountAccessRepository;

@Service
public class AccountAccessService {
    private final AccountAccessRepository repository;
    private final boolean testAccess;
    private static final Map<String,String> TEST_ROLES = Map.of(
        "administrador@gmail.com","ADMIN", "postulante1@gmail.com","CANDIDATO", "reclutador1@gmail.com","RECLUTADOR");
    public AccountAccessService(AccountAccessRepository repository, @Value("${app.security.test-access-enabled:false}") boolean testAccess) {
        this.repository=repository; this.testAccess=testAccess;
    }

    public AccountIdentity find(String email) {
        return repository.find(email)
            .stream().findFirst().orElseThrow(()->new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Cuenta no disponible"));
    }
    public boolean bypass(AccountIdentity a) {
        return testAccess && a.exempt() && "activo".equals(a.status())
            && a.role().equals(TEST_ROLES.get(a.email().toLowerCase(Locale.ROOT)));
    }
    public void validate(String token, JwtService jwt) {
        var a=find(jwt.getEmail(token));
        if (!"activo".equals(a.status()) || !a.role().equals(jwt.getRole(token)) || a.version()!=jwt.getVersion(token)
            || ("TEST_PASSWORD".equals(jwt.getMethod(token)) && !bypass(a)))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"La sesión cambió. Inicia sesión nuevamente.");
    }
}
