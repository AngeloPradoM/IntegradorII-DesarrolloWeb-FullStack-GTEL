package pe.com.gtel.talento.recruitment.service;

import java.util.*;
import jakarta.validation.constraints.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
public class ProfileService {
    public record Profile(@NotBlank @Size(max=100) String nombres,@NotBlank @Size(max=100) String apellidos,
        @NotBlank @Pattern(regexp="\\+[1-9][0-9]{7,14}") String telefono,
        @Size(max=100) String ubicacion,@Size(max=100) String localidad,
        @Email @Size(max=150) String correoContacto,@Size(max=2800000) String foto,
        @Size(max=10000) String educacion,@Size(max=10000) String experiencia) {}
    private final JdbcTemplate jdbc;
    private final WorkflowIdentity identity;
    public ProfileService(JdbcTemplate jdbc,WorkflowIdentity identity){this.jdbc=jdbc;this.identity=identity;}
    public Map<String,Object> get(String email) {
        long id=identity.actor(email).id();
        return jdbc.queryForMap("""
          SELECT u.id,u.email,COALESCE(c.nombres,p.nombres,'') nombres,COALESCE(c.apellidos,p.apellidos,'') apellidos,
          COALESCE(c.telefono,p.telefono,'') telefono,COALESCE(c.ubicacion,'') ubicacion,COALESCE(c.localidad,'') localidad,
          COALESCE(c.correo_contacto,'') correoContacto,COALESCE(c.foto,'') foto,
          COALESCE(c.educacion,p.educacion,'') educacion,COALESCE(c.experiencia,p.experiencia,'') experiencia
          FROM usuarios u LEFT JOIN perfiles_contacto c ON c.usuario_id=u.id LEFT JOIN postulantes p ON p.usuario_id=u.id WHERE u.id=?
          """,id);
    }
    @Transactional public Map<String,Object> save(String email,Profile p) {
        var actor=identity.actor(email);
        if(p.foto()!=null&&!p.foto().isEmpty()) validateImage(p.foto());
        jdbc.update("""
          INSERT INTO perfiles_contacto(usuario_id,nombres,apellidos,telefono,ubicacion,localidad,correo_contacto,foto,educacion,experiencia)
          VALUES(?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE nombres=VALUES(nombres),apellidos=VALUES(apellidos),telefono=VALUES(telefono),
          ubicacion=VALUES(ubicacion),localidad=VALUES(localidad),correo_contacto=VALUES(correo_contacto),foto=VALUES(foto),educacion=VALUES(educacion),experiencia=VALUES(experiencia)
          """,actor.id(),p.nombres().trim(),p.apellidos().trim(),p.telefono(),p.ubicacion(),p.localidad(),p.correoContacto(),p.foto(),p.educacion(),p.experiencia());
        jdbc.update("UPDATE postulantes SET nombres=?,apellidos=?,telefono=?,educacion=?,experiencia=? WHERE usuario_id=?",
            p.nombres().trim(),p.apellidos().trim(),p.telefono(),p.educacion(),p.experiencia(),actor.id());
        identity.audit(actor,"usuarios",actor.id(),"actualizar","Actualización del perfil personal");
        return get(email);
    }
    private void validateImage(String value) {
        try {
            if(!value.matches("^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$"))throw new IllegalArgumentException();
            byte[] bytes=Base64.getDecoder().decode(value.substring(value.indexOf(',')+1));
            boolean png=bytes.length>8&&bytes[0]==(byte)137&&bytes[1]==80&&bytes[2]==78&&bytes[3]==71;
            boolean jpg=bytes.length>3&&bytes[0]==(byte)255&&bytes[1]==(byte)216&&bytes[2]==(byte)255;
            boolean webp=bytes.length>12&&new String(bytes,0,4,java.nio.charset.StandardCharsets.US_ASCII).equals("RIFF")&&new String(bytes,8,4,java.nio.charset.StandardCharsets.US_ASCII).equals("WEBP");
            if(bytes.length>2*1024*1024||!(png||jpg||webp))throw new IllegalArgumentException();
        }catch(IllegalArgumentException e){throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Foto inválida; usa JPG, PNG o WebP de hasta 2 MB");}
    }
}
