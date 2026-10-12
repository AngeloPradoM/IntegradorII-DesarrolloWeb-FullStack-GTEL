package pe.com.gtel.talento.security;
import java.nio.charset.StandardCharsets;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
public final class PasswordPolicy {
 private PasswordPolicy() {}
 public static void validate(String password) {
  if(password==null||password.length()<12||password.getBytes(StandardCharsets.UTF_8).length>72)
   throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"La contraseña debe tener al menos 12 caracteres y no superar 72 bytes UTF-8.");
 }
}
