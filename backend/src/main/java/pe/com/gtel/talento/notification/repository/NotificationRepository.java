package pe.com.gtel.talento.notification.repository;

import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class NotificationRepository {
    private final JdbcTemplate jdbc;
    public NotificationRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public void enqueue(long user,String title,String message) {
        jdbc.update("INSERT INTO notificaciones(usuario_id,titulo,mensaje) VALUES(?,?,?)",user,title,message);
    }

    public List<Map<String,Object>> list(long user) {
        return jdbc.queryForList("SELECT id,titulo title,mensaje description,fecha,leida FROM notificaciones WHERE usuario_id=? ORDER BY id DESC LIMIT 100",user);
    }

    public void markRead(long id,long user) {
        jdbc.update("UPDATE notificaciones SET leida=TRUE WHERE id=? AND usuario_id=?",id,user);
    }

    public List<Map<String,Object>> lockNextDelivery(long now) {
        return jdbc.queryForList("SELECT n.id,n.usuario_id,n.titulo,n.mensaje FROM notificaciones n WHERE enviada=FALSE AND intentos<5 AND proximo_intento<=? ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED",now);
    }

    public List<String> activeEmails(Object userId) {
        return jdbc.queryForList("SELECT email FROM usuarios WHERE id=? AND estado='activo'",String.class,userId);
    }

    public void stopRetries(long id) {
        jdbc.update("UPDATE notificaciones SET intentos=5 WHERE id=?",id);
    }

    public void markDelivered(long id) {
        jdbc.update("UPDATE notificaciones SET enviada=TRUE,intentos=intentos+1 WHERE id=?",id);
    }

    public void scheduleRetry(long id,long retryAt) {
        jdbc.update("UPDATE notificaciones SET intentos=intentos+1,proximo_intento=? WHERE id=?",retryAt,id);
    }
}
