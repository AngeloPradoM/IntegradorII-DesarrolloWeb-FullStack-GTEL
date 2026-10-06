package pe.com.gtel.talento.recruitment.interview.service;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import pe.com.gtel.talento.identity.service.WorkflowIdentity;
import pe.com.gtel.talento.notification.service.NotificationService;
import pe.com.gtel.talento.recruitment.application.service.ApplicationService;
import pe.com.gtel.talento.recruitment.interview.dto.InterviewRequest;
import pe.com.gtel.talento.recruitment.interview.repository.InterviewRepository;
import static org.springframework.http.HttpStatus.*;

@Service
public class InterviewService {

    private final InterviewRepository repository;
    private final WorkflowIdentity identity;
    private final ApplicationService applications;
    private final NotificationService notifications;
    public InterviewService(InterviewRepository repository,WorkflowIdentity identity,ApplicationService applications,NotificationService notifications){this.repository=repository;this.identity=identity;this.applications=applications;this.notifications=notifications;}
    public List<Map<String,Object>> interviews(){return repository.interviews();}
    @Transactional public Map<String,Object> interview(Long id,InterviewRequest r,String email){
        var actor=identity.actor(email);identity.recruiter(actor);
        repository.lockRecruiterRole();
        var application=applications.get(r.applicationId(),email);
        if(id!=null&&repository.countInterview(id,r.applicationId())==0)throw new ResponseStatusException(NOT_FOUND);
        if(r.status().equals("programada")){
            if(LocalDateTime.of(r.date(),r.time()).isBefore(LocalDateTime.now()))throw new ResponseStatusException(BAD_REQUEST,"La entrevista debe programarse en el futuro");
            if(r.time().plusMinutes(r.minutes()).isBefore(r.time()))throw new ResponseStatusException(BAD_REQUEST,"La entrevista debe terminar el mismo día");
            // Shared recruiting agenda: conservatively reject any overlapping scheduled interview.
            var events=repository.scheduledOn(r.date(),id==null?-1:id);
            for(var event:events){var start=LocalTime.parse(event.get("hora").toString());var end=start.plusMinutes(((Number)event.get("duracion_min")).intValue());
                if(r.time().isBefore(end)&&r.time().plusMinutes(r.minutes()).isAfter(start))throw new ResponseStatusException(CONFLICT,"La agenda ya tiene una entrevista en ese horario");}
        }
        if(id==null){id=repository.insertInterview(r);}
        repository.updateInterview(id,r);
        identity.audit(actor,"entrevistas",id,"actualizar","Agenda: "+r.status());
        notifications.enqueue(((Number)application.get("userId")).longValue(),"Entrevista: "+r.status(),"Postulación "+application.get("code")+". Fecha: "+r.date()+" "+r.time()+". Modalidad: "+r.type()+". Lugar o enlace: "+r.location());
        final long selected=id;return interviews().stream().filter(x->((Number)x.get("id")).longValue()==selected).findFirst().orElseThrow();
    }
}
