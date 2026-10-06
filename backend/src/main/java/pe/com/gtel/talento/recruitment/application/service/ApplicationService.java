package pe.com.gtel.talento.recruitment.application.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import pe.com.gtel.talento.identity.service.WorkflowIdentity;
import pe.com.gtel.talento.notification.service.NotificationService;
import pe.com.gtel.talento.recruitment.application.dto.ApplicationPersonalRequest;
import pe.com.gtel.talento.recruitment.application.repository.ApplicationRepository;
import static org.springframework.http.HttpStatus.*;

@Service
public class ApplicationService {

    private final ApplicationRepository repository;
    private final WorkflowIdentity identity;
    private final NotificationService notifications;
    private final ObjectMapper json;
    public ApplicationService(ApplicationRepository repository,WorkflowIdentity identity,NotificationService notifications,ObjectMapper json){this.repository=repository;this.identity=identity;this.notifications=notifications;this.json=json;}
    public List<Map<String,Object>> list(String email,boolean recruiter){
        var actor=identity.actor(email);if(recruiter)identity.recruiter(actor);
        var rows=recruiter?repository.listAll():repository.listByUser(actor.id());
        for(var row:rows)row.put("steps",repository.timeline(row.get("id")));
        return rows;
    }
    public Map<String,Object> get(long id,String email){
        var actor=identity.actor(email);var rows=repository.find(id);
        if(rows.isEmpty())throw new ResponseStatusException(NOT_FOUND);
        var row=rows.getFirst();
        if(!actor.role().equals("ADMIN")&&!actor.role().equals("RECLUTADOR")&&((Number)row.get("userId")).longValue()!=actor.id())throw new ResponseStatusException(NOT_FOUND);
        return row;
    }
    @Transactional public Map<String,Object> apply(long job,ApplicationPersonalRequest data,boolean terms,MultipartFile cv,String email) {
        var actor=identity.actor(email);
        if(!terms)throw new ResponseStatusException(BAD_REQUEST,"Debes aceptar las condiciones");
        byte[] bytes=pdf(cv);
        var profile=repository.lockCandidate(actor.id());
        if(profile.isEmpty())throw new ResponseStatusException(BAD_REQUEST,"Se requiere una cuenta con perfil de candidato");
        long candidate=profile.getFirst();
        var jobs=repository.lockJob(job);
        if(jobs.isEmpty())throw new ResponseStatusException(NOT_FOUND,"Oferta no encontrada");
        if(!"activa".equals(jobs.getFirst().get("estado")))throw new ResponseStatusException(CONFLICT,"La vacante no está abierta");
        var deadline=jobs.getFirst().get("fecha_limite_postulacion");
        if(deadline!=null&&LocalDate.parse(deadline.toString()).isBefore(LocalDate.now()))throw new ResponseStatusException(CONFLICT,"La convocatoria finalizó");
        if(repository.countByCandidateAndJob(candidate,job)>0)throw new ResponseStatusException(CONFLICT,"Ya postulaste a esta oferta");
        String code="GTEL-"+UUID.randomUUID().toString().replace("-","").substring(0,24);
        long id=repository.insert(code,candidate,job);
        try{repository.insertDocument(id,bytes,json.writeValueAsString(data));}
        catch(com.fasterxml.jackson.core.JsonProcessingException e){throw new ResponseStatusException(BAD_REQUEST,"Datos inválidos");}
        repository.updateDocumentNumber(candidate,data.dni());
        timeline(id,null,"recibida",actor.id(),"Postulación registrada");
        identity.audit(actor,"postulaciones",id,"crear","Postulación con CV");
        notifications.enqueue(actor.id(),"Postulación recibida","Registramos tu postulación "+code+". Consulta su avance en Mis postulaciones.");
        return get(id,email);
    }
    static byte[] pdf(MultipartFile file){
        if(file==null||file.isEmpty()||file.getSize()>5*1024*1024)throw new ResponseStatusException(BAD_REQUEST,"Adjunta un PDF de hasta 5 MB");
        try{byte[] b=file.getBytes();String head=new String(b,0,Math.min(b.length,8),StandardCharsets.US_ASCII);
            String tail=new String(b,Math.max(0,b.length-1024),Math.min(1024,b.length),StandardCharsets.US_ASCII);
            if(!head.startsWith("%PDF-")||!tail.contains("%%EOF"))throw new ResponseStatusException(BAD_REQUEST,"El archivo no tiene estructura PDF válida");return b;
        }catch(java.io.IOException e){throw new ResponseStatusException(BAD_REQUEST,"No se pudo leer el PDF");}
    }
    public byte[] document(long id,String email){
        get(id,email);
        var docs=repository.document(id);
        if(docs.isEmpty())throw new ResponseStatusException(NOT_FOUND,"Esta postulación no tiene un CV almacenado");return docs.getFirst();
    }
    @Transactional public Map<String,Object> status(long id,String state,String email){
        var actor=identity.actor(email);identity.recruiter(actor);
        var old=repository.lockStatus(id);
        if(old.isEmpty())throw new ResponseStatusException(NOT_FOUND);
        var allowed=Map.of("recibida",Set.of("en_revision","entrevista","rechazada"),"en_revision",Set.of("entrevista","aprobada","rechazada"),"entrevista",Set.of("en_revision","aprobada","rechazada"));
        if(old.getFirst().equals(state))return get(id,email);
        if(!allowed.getOrDefault(old.getFirst(),Set.of()).contains(state))throw new ResponseStatusException(CONFLICT,"Transición no permitida desde "+old.getFirst());
        repository.updateStatus(id,state);
        timeline(id,old.getFirst(),state,actor.id(),"Actualización por reclutamiento");
        identity.audit(actor,"postulaciones",id,"actualizar","Estado: "+old.getFirst()+" → "+state);
        var result=get(id,email);notifications.enqueue(((Number)result.get("userId")).longValue(),"Estado de postulación","Tu postulación "+result.get("code")+" cambió a "+state+".");return result;
    }
    private void timeline(long id,String old,String state,long actor,String comment){repository.insertTimeline(id,old,state,actor,comment);}
}
