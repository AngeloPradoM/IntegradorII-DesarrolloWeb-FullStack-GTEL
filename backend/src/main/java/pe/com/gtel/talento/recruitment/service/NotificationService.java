package pe.com.gtel.talento.recruitment.service;

import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Durable outbox. Scheduling lives in a separate bean so the transaction proxy is used. */
@Service
public class NotificationService {
    private final JdbcTemplate jdbc;
    private final JavaMailSender mail;
    private final String from;
    public NotificationService(JdbcTemplate jdbc,JavaMailSender mail,@Value("${spring.mail.username:}") String from){this.jdbc=jdbc;this.mail=mail;this.from=from;}
    public void enqueue(long user,String title,String message){
        jdbc.update("INSERT INTO notificaciones(usuario_id,titulo,mensaje) VALUES(?,?,?)",user,title,message);
    }
    public List<Map<String,Object>> list(long user){return jdbc.queryForList("SELECT id,titulo title,mensaje description,fecha,leida FROM notificaciones WHERE usuario_id=? ORDER BY id DESC LIMIT 100",user);}
    public void read(long id,long user){jdbc.update("UPDATE notificaciones SET leida=TRUE WHERE id=? AND usuario_id=?",id,user);}
    @Transactional public void deliverOne() {
        var rows=jdbc.queryForList("SELECT n.id,n.usuario_id,n.titulo,n.mensaje FROM notificaciones n WHERE enviada=FALSE AND intentos<5 AND proximo_intento<=? ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED",System.currentTimeMillis());
        if(rows.isEmpty())return;
        var row=rows.getFirst();long id=((Number)row.get("id")).longValue();
        try {
            var emails=jdbc.queryForList("SELECT email FROM usuarios WHERE id=? AND estado='activo'",String.class,row.get("usuario_id"));
            if(emails.isEmpty()) {jdbc.update("UPDATE notificaciones SET intentos=5 WHERE id=?",id);return;}
            var message=new SimpleMailMessage();message.setFrom(from);message.setTo(emails.getFirst());
            message.setSubject("GTEL Talento — "+row.get("titulo"));message.setText(row.get("mensaje").toString());mail.send(message);
            jdbc.update("UPDATE notificaciones SET enviada=TRUE,intentos=intentos+1 WHERE id=?",id);
        }catch(org.springframework.mail.MailException|IllegalArgumentException e){
            jdbc.update("UPDATE notificaciones SET intentos=intentos+1,proximo_intento=? WHERE id=?",System.currentTimeMillis()+300000,id);
        }
    }
}
