package pe.com.gtel.talento.profile.service;

import java.util.Base64;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import pe.com.gtel.talento.identity.service.WorkflowIdentity;
import pe.com.gtel.talento.profile.dto.ProfileRequest;
import pe.com.gtel.talento.profile.repository.ProfileRepository;

@Service
public class ProfileService {

    private final ProfileRepository repository;
    private final WorkflowIdentity identity;
    public ProfileService(ProfileRepository repository,WorkflowIdentity identity){this.repository=repository;this.identity=identity;}
    public Map<String,Object> get(String email) {
        long id=identity.actor(email).id();
        return repository.find(id);
    }
    @Transactional public Map<String,Object> save(String email,ProfileRequest p) {
        var actor=identity.actor(email);
        if(p.foto()!=null&&!p.foto().isEmpty()) validateImage(p.foto());
        repository.saveContact(actor.id(),p);
        repository.updateCandidate(actor.id(),p);
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
