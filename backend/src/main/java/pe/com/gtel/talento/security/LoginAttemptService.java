package pe.com.gtel.talento.security;
import java.time.Clock;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
/** Bounded per-account login budget for a single application instance. OTP has its own budget. */
@Service
public class LoginAttemptService {
 private static final long WINDOW=15*60*1000L;
 private final Map<String,Attempt> attempts=new HashMap<>();private final Clock clock;
 private record Attempt(int count,long expires) {}
 public LoginAttemptService(){this(Clock.systemUTC());}
 LoginAttemptService(Clock clock){this.clock=clock;}
 private String key(String email){return email.trim().toLowerCase(Locale.ROOT);}
 public synchronized void begin(String email){
  long now=clock.millis();attempts.values().removeIf(a->a.expires<=now);String key=key(email);Attempt old=attempts.get(key);
  if((old!=null&&old.count>=5)||(old==null&&attempts.size()>=10000))throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,"Demasiados intentos. Espera 15 minutos antes de volver a intentar.");
  attempts.put(key,new Attempt(old==null?1:old.count+1,old==null?now+WINDOW:old.expires));
 }
 public synchronized void succeeded(String email){attempts.remove(key(email));}
}
