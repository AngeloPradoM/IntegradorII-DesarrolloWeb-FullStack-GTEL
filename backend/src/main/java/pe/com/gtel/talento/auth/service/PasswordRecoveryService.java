package pe.com.gtel.talento.auth.service;

import java.util.*;
import java.security.*;
import java.nio.charset.StandardCharsets;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;

@Service
public class PasswordRecoveryService {
    private final JdbcTemplate jdbc;
    private final JavaMailSender mail;
    private final PasswordEncoder encoder;
    private final String from,url;
    public PasswordRecoveryService(JdbcTemplate jdbc,JavaMailSender mail,PasswordEncoder encoder,
        @Value("${spring.mail.username:}") String from,@Value("${app.recovery-url:http://localhost:5173/recuperar-acceso}") String url){this.jdbc=jdbc;this.mail=mail;this.encoder=encoder;this.from=from;this.url=url;}
    @Transactional public void request(String email){
        var users=jdbc.queryForList("SELECT id FROM usuarios WHERE LOWER(email)=LOWER(?) AND estado='activo' FOR UPDATE",Long.class,email.trim());
        if(users.isEmpty())return;long user=users.getFirst();long now=System.currentTimeMillis();
        var previous=jdbc.queryForList("SELECT solicitado FROM recuperacion_acceso WHERE usuario_id=?",Long.class,user);
        if(!previous.isEmpty()&&now-previous.getFirst()<60000)return;
        byte[] bytes=new byte[32];new SecureRandom().nextBytes(bytes);String token=Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        jdbc.update("DELETE FROM recuperacion_acceso WHERE usuario_id=?",user);
        jdbc.update("INSERT INTO recuperacion_acceso(usuario_id,token_hash,expira,solicitado) VALUES(?,?,?,?)",user,hash(token),now+15*60000,now);
        var message=new SimpleMailMessage();message.setFrom(from);message.setTo(email.trim());message.setSubject("GTEL Talento — Recuperar acceso");
        message.setText("Solicitaste restablecer tu contraseña. Abre este enlace de un solo uso, válido por 15 minutos:\n"+url+"#token="+token+"\nSi no lo solicitaste, ignora este mensaje.");
        try{mail.send(message);}catch(org.springframework.mail.MailException|IllegalArgumentException e){
            // Keep cooldown; never reveal whether the address exists or expose the token.
            jdbc.update("UPDATE recuperacion_acceso SET expira=0 WHERE usuario_id=?",user);
        }
    }
    @Transactional public void reset(String token,String password){
        if(token==null||!token.matches("[A-Za-z0-9_-]{43}")||password==null||password.length()<12||password.getBytes(StandardCharsets.UTF_8).length>72)
            throw new ResponseStatusException(BAD_REQUEST,"Enlace inválido o contraseña fuera de límites (mínimo 12 caracteres; máximo 72 bytes)");
        // Determine identity then acquire user before challenge locks, matching request/admin order.
        var ids=jdbc.queryForList("SELECT usuario_id FROM recuperacion_acceso WHERE token_hash=?",Long.class,hash(token));
        if(ids.isEmpty())throw new ResponseStatusException(BAD_REQUEST,"Enlace inválido o vencido");
        long id=ids.getFirst();jdbc.queryForObject("SELECT id FROM usuarios WHERE id=? FOR UPDATE",Long.class,id);
        var rows=jdbc.queryForList("SELECT expira FROM recuperacion_acceso WHERE usuario_id=? AND token_hash=? FOR UPDATE",Long.class,id,hash(token));
        if(rows.isEmpty()||rows.getFirst()<System.currentTimeMillis())throw new ResponseStatusException(BAD_REQUEST,"Enlace inválido o vencido");
        int changed=jdbc.update("UPDATE usuarios SET password_hash=?,auth_version=auth_version+1,otp_exempt=FALSE WHERE id=? AND estado='activo'",encoder.encode(password),id);
        if(changed!=1)throw new ResponseStatusException(BAD_REQUEST,"Cuenta no disponible");
        jdbc.update("DELETE FROM recuperacion_acceso WHERE usuario_id=?",id);jdbc.update("DELETE FROM auth_email_challenges WHERE usuario_id=?",id);
        jdbc.update("INSERT INTO auditoria(tabla_afectada,registro_id,accion,detalle,usuario_id) VALUES('usuarios',?,'actualizar','Recuperación de contraseña',?)",id,id);
    }
    private String hash(String value){try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));}catch(NoSuchAlgorithmException e){throw new IllegalStateException(e);}}
}
