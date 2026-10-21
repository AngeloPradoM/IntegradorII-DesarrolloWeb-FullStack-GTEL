package pe.com.gtel.talento.mail;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class VerificationMailService {
    private final JavaMailSender sender;
    private final String from;
    public VerificationMailService(JavaMailSender sender, @Value("${spring.mail.username:}") String from) {
        this.sender = sender;
        this.from = from;
    }
    public void send(String recipient, String code) {
        if (from.isBlank()) throw new IllegalStateException("Remitente no configurado");
        var message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(recipient);
        message.setSubject("GTEL Talento - Código de acceso");
        message.setText("Tu código para iniciar sesión es: " + code
                + "\n\nVence en 5 minutos. No lo compartas. Si no solicitaste este acceso, ignora este mensaje.");
        sender.send(message);
    }
}
