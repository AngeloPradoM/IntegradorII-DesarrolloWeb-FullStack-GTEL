package pe.com.gtel.talento.notification.service;

import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.com.gtel.talento.notification.repository.NotificationRepository;

/** Durable outbox. Scheduling lives in a separate bean so the transaction proxy is used. */
@Service
public class NotificationService {
    private final NotificationRepository repository;
    private final JavaMailSender mail;
    private final String from;
    public NotificationService(NotificationRepository repository,JavaMailSender mail,@Value("${spring.mail.username:}") String from){this.repository=repository;this.mail=mail;this.from=from;}
    public void enqueue(long user,String title,String message){
        repository.enqueue(user,title,message);
    }
    public List<Map<String,Object>> list(long user){return repository.list(user);}
    public void read(long id,long user){repository.markRead(id,user);}
    @Transactional public void deliverOne() {
        var rows=repository.lockNextDelivery(System.currentTimeMillis());
        if(rows.isEmpty())return;
        var row=rows.getFirst();long id=((Number)row.get("id")).longValue();
        try {
            var emails=repository.activeEmails(row.get("usuario_id"));
            if(emails.isEmpty()) {repository.stopRetries(id);return;}
            var message=new SimpleMailMessage();message.setFrom(from);message.setTo(emails.getFirst());
            message.setSubject("GTEL Talento — "+row.get("titulo"));message.setText(row.get("mensaje").toString());mail.send(message);
            repository.markDelivered(id);
        }catch(org.springframework.mail.MailException|IllegalArgumentException e){
            repository.scheduleRetry(id,System.currentTimeMillis()+300000);
        }
    }
}
