package pe.com.gtel.talento.auth.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import pe.com.gtel.talento.auth.repository.PasswordRecoveryRepository;
import static org.springframework.http.HttpStatus.*;

@Service
public class PasswordRecoveryService {
    private final PasswordRecoveryRepository repository;
    private final JavaMailSender mail;
    private final PasswordEncoder encoder;
    private final String from,url;
    public PasswordRecoveryService(PasswordRecoveryRepository repository,JavaMailSender mail,PasswordEncoder encoder,
        @Value("${spring.mail.username:}") String from,@Value("${app.recovery-url:http://localhost:5173/recuperar-acceso}") String url){this.repository=repository;this.mail=mail;this.encoder=encoder;this.from=from;this.url=url;}
    @Transactional public void request(String email){
        var users=repository.lockActiveUser(email.trim());
        if(users.isEmpty())return;long user=users.getFirst();long now=System.currentTimeMillis();
        var previous=repository.lastRequested(user);
        if(!previous.isEmpty()&&now-previous.getFirst()<60000)return;
        byte[] bytes=new byte[32];new SecureRandom().nextBytes(bytes);String token=Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        repository.deletePrevious(user);
        repository.insert(user,hash(token),now+15*60000,now);
        var message=new SimpleMailMessage();message.setFrom(from);message.setTo(email.trim());message.setSubject("GTEL Talento — Recuperar acceso");
        message.setText("Solicitaste restablecer tu contraseña. Abre este enlace de un solo uso, válido por 15 minutos:\n"+url+"#token="+token+"\nSi no lo solicitaste, ignora este mensaje.");
        try{mail.send(message);}catch(org.springframework.mail.MailException|IllegalArgumentException e){
            // Keep cooldown; never reveal whether the address exists or expose the token.
            repository.expire(user);
        }
    }
    @Transactional public void reset(String token,String password){
        if(token==null||!token.matches("[A-Za-z0-9_-]{43}")||password==null||password.length()<12||password.getBytes(StandardCharsets.UTF_8).length>72)
            throw new ResponseStatusException(BAD_REQUEST,"Enlace inválido o contraseña fuera de límites (mínimo 12 caracteres; máximo 72 bytes)");
        // Determine identity then acquire user before challenge locks, matching request/admin order.
        var ids=repository.findUser(hash(token));
        if(ids.isEmpty())throw new ResponseStatusException(BAD_REQUEST,"Enlace inválido o vencido");
        long id=ids.getFirst();repository.lockUser(id);
        var rows=repository.lockExpiry(id,hash(token));
        if(rows.isEmpty()||rows.getFirst()<System.currentTimeMillis())throw new ResponseStatusException(BAD_REQUEST,"Enlace inválido o vencido");
        int changed=repository.updatePassword(id,encoder.encode(password));
        if(changed!=1)throw new ResponseStatusException(BAD_REQUEST,"Cuenta no disponible");
        repository.deleteByUser(id);repository.deleteOtp(id);
        repository.auditReset(id);
    }
    private String hash(String value){try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));}catch(NoSuchAlgorithmException e){throw new IllegalStateException(e);}}
}
