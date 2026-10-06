package pe.com.gtel.talento.profile.repository;

import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import pe.com.gtel.talento.profile.dto.ProfileRequest;

@Repository
public class ProfileRepository {
    private final JdbcTemplate jdbc;
    public ProfileRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public Map<String,Object> find(long id) {
        return jdbc.queryForMap("""
          SELECT u.id,u.email,COALESCE(c.nombres,p.nombres,'') nombres,COALESCE(c.apellidos,p.apellidos,'') apellidos,
          COALESCE(c.telefono,p.telefono,'') telefono,COALESCE(c.ubicacion,'') ubicacion,COALESCE(c.localidad,'') localidad,
          COALESCE(c.correo_contacto,'') correoContacto,COALESCE(c.foto,'') foto,
          COALESCE(c.educacion,p.educacion,'') educacion,COALESCE(c.experiencia,p.experiencia,'') experiencia
          FROM usuarios u LEFT JOIN perfiles_contacto c ON c.usuario_id=u.id LEFT JOIN postulantes p ON p.usuario_id=u.id WHERE u.id=?
          """,id);
    }

    public void saveContact(long userId,ProfileRequest p) {
        jdbc.update("""
          INSERT INTO perfiles_contacto(usuario_id,nombres,apellidos,telefono,ubicacion,localidad,correo_contacto,foto,educacion,experiencia)
          VALUES(?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE nombres=VALUES(nombres),apellidos=VALUES(apellidos),telefono=VALUES(telefono),
          ubicacion=VALUES(ubicacion),localidad=VALUES(localidad),correo_contacto=VALUES(correo_contacto),foto=VALUES(foto),educacion=VALUES(educacion),experiencia=VALUES(experiencia)
          """,userId,p.nombres().trim(),p.apellidos().trim(),p.telefono(),p.ubicacion(),p.localidad(),p.correoContacto(),p.foto(),p.educacion(),p.experiencia());
    }

    public void updateCandidate(long userId,ProfileRequest p) {
        jdbc.update("UPDATE postulantes SET nombres=?,apellidos=?,telefono=?,educacion=?,experiencia=? WHERE usuario_id=?",
            p.nombres().trim(),p.apellidos().trim(),p.telefono(),p.educacion(),p.experiencia(),userId);
    }
}
