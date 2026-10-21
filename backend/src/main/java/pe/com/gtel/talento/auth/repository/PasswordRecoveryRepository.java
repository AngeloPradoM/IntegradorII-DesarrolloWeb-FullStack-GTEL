package pe.com.gtel.talento.auth.repository;

import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class PasswordRecoveryRepository {
    private final JdbcTemplate jdbc;
    public PasswordRecoveryRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public List<Long> lockActiveUser(String email) {
        return jdbc.queryForList("SELECT id FROM usuarios WHERE LOWER(email)=LOWER(?) AND estado='activo' FOR UPDATE",Long.class,email);
    }

    public List<Long> lastRequested(long user) {
        return jdbc.queryForList("SELECT solicitado FROM recuperacion_acceso WHERE usuario_id=?",Long.class,user);
    }

    public void deletePrevious(long user) {
        jdbc.update("DELETE FROM recuperacion_acceso WHERE usuario_id=?",user);
    }

    public void insert(long user,String tokenHash,long expires,long now) {
        jdbc.update("INSERT INTO recuperacion_acceso(usuario_id,token_hash,expira,solicitado) VALUES(?,?,?,?)",user,tokenHash,expires,now);
    }

    public void expire(long user) {
        jdbc.update("UPDATE recuperacion_acceso SET expira=0 WHERE usuario_id=?",user);
    }

    public List<Long> findUser(String tokenHash) {
        return jdbc.queryForList("SELECT usuario_id FROM recuperacion_acceso WHERE token_hash=?",Long.class,tokenHash);
    }

    public Long lockUser(long id) {
        return jdbc.queryForObject("SELECT id FROM usuarios WHERE id=? FOR UPDATE",Long.class,id);
    }

    public List<Long> lockExpiry(long id,String tokenHash) {
        return jdbc.queryForList("SELECT expira FROM recuperacion_acceso WHERE usuario_id=? AND token_hash=? FOR UPDATE",Long.class,id,tokenHash);
    }

    public int updatePassword(long id,String passwordHash) {
        return jdbc.update("UPDATE usuarios SET password_hash=?,auth_version=auth_version+1,otp_exempt=FALSE WHERE id=? AND estado='activo'",passwordHash,id);
    }

    public void deleteByUser(long id) {
        jdbc.update("DELETE FROM recuperacion_acceso WHERE usuario_id=?",id);
    }

    public void deleteOtp(long id) {
        jdbc.update("DELETE FROM auth_email_challenges WHERE usuario_id=?",id);
    }

    public void auditReset(long id) {
        jdbc.update("INSERT INTO auditoria(tabla_afectada,registro_id,accion,detalle,usuario_id) VALUES('usuarios',?,'actualizar','Recuperación de contraseña',?)",id,id);
    }
}
