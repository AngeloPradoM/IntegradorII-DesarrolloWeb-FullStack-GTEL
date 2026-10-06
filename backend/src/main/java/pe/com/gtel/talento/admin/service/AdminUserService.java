package pe.com.gtel.talento.admin.service;

import java.nio.charset.StandardCharsets;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import pe.com.gtel.talento.admin.dto.AdminUserPageResponse;
import pe.com.gtel.talento.admin.dto.AdminUserResponse;
import pe.com.gtel.talento.admin.dto.UserRequest;
import pe.com.gtel.talento.admin.repository.AdminUserRepository;

@Service
public class AdminUserService {
    private final AdminUserRepository repository;
    private final PasswordEncoder encoder;
    public AdminUserService(AdminUserRepository repository,PasswordEncoder encoder){this.repository=repository;this.encoder=encoder;}

    @Transactional(readOnly=true)
    public AdminUserPageResponse list(String search,int page) {
        if(page<0||page>100000)throw bad("Página inválida");
        String pattern="%"+search.toLowerCase(Locale.ROOT)+"%";
        return new AdminUserPageResponse(repository.list(pattern,page),repository.count(pattern),page);
    }
    @Transactional
    public AdminUserResponse save(Long id,UserRequest request,String actor) {
        // Serialize administration to preserve the last active administrator even under concurrent edits.
        repository.lockAdminRole();
        Long actorId=repository.actorId(actor);
        boolean creating=id==null;
        String auditDetail="Creación de cuenta; rol: "+request.rol()+"; estado: "+request.estado();
        String email=request.email().trim().toLowerCase(Locale.ROOT);
        String hash=null;
        if(request.password()!=null&&!request.password().isBlank()){
            if(request.password().length()<12 || request.password().getBytes(StandardCharsets.UTF_8).length>72)
                throw bad("La contraseña debe tener al menos 12 caracteres y no superar 72 bytes.");
            hash=encoder.encode(request.password());
        } else if(id==null)throw bad("La contraseña es obligatoria para crear usuarios.");
        if("CANDIDATO".equals(request.rol()) && (blank(request.nombres())||blank(request.apellidos())))
            throw bad("Nombres y apellidos son obligatorios para candidatos.");
        Long roleId=repository.roleId(request.rol());
        if(repository.countDuplicateEmail(email,id==null?-1:id)>0)
            throw new ResponseStatusException(HttpStatus.CONFLICT,"El correo ya está registrado.");
        if(id==null){
            repository.insert(email,hash,roleId,request.estado());
            id=repository.idByEmail(email);
        } else {
            var old=repository.find(id).stream().findFirst().orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Usuario no encontrado"));
            auditDetail="Edición de cuenta";
            if(!old.rol().equals(request.rol())) auditDetail+="; cambio de rol: "+old.rol()+" -> "+request.rol();
            if(!old.estado().equals(request.estado())) auditDetail+="; "+("activo".equals(request.estado())?"activación":"desactivación")+": "+old.estado()+" -> "+request.estado();
            if(!old.email().equalsIgnoreCase(email)) auditDetail+="; cambio de correo";
            if(hash!=null) auditDetail+="; cambio de contraseña";
            if(old.email().equalsIgnoreCase(actor) && (!"ADMIN".equals(request.rol())||!"activo".equals(request.estado())))
                throw bad("No puedes quitarte el acceso de administrador ni desactivar tu propia cuenta.");
            if("ADMIN".equals(old.rol())&&"activo".equals(old.estado())&&(!"ADMIN".equals(request.rol())||!"activo".equals(request.estado()))
                &&repository.activeAdmins()<=1)
                throw bad("Debe existir al menos un administrador activo.");
            repository.update(id,email,roleId,request.estado(),hash,old.email().equalsIgnoreCase(email)&&old.rol().equals(request.rol()));
            // Pending OTPs cannot survive a password, role, email or status update.
            repository.deleteOtp(id);
            repository.deleteRecovery(id);
        }
        if("CANDIDATO".equals(request.rol())){
            repository.saveCandidate(id,request);
            repository.updateContact(id,request);
        }
        repository.audit(id,creating,auditDetail,actorId);
        // Keep historical candidate profiles on role changes; they may have applications attached.
        return repository.get(id).getFirst();
    }
    private boolean blank(String value){return value==null||value.isBlank();}
    private ResponseStatusException bad(String message){return new ResponseStatusException(HttpStatus.BAD_REQUEST,message);}
}
