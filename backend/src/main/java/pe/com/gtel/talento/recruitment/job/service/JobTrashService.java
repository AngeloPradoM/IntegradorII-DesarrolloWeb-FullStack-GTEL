package pe.com.gtel.talento.recruitment.job.service;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import pe.com.gtel.talento.identity.service.WorkflowIdentity;
import pe.com.gtel.talento.recruitment.job.repository.JobTrashRepository;
import static org.springframework.http.HttpStatus.*;

@Service
public class JobTrashService {
    private final JobTrashRepository repository;
    private final WorkflowIdentity identity;
    public JobTrashService(JobTrashRepository repository,WorkflowIdentity identity){this.repository=repository;this.identity=identity;}
    private void lock(long id){
        repository.lockRecruiterRole();
        if(repository.lockJob(id).isEmpty())throw new ResponseStatusException(NOT_FOUND,"Oferta no encontrada");
    }
    public List<Map<String,Object>> list(){return repository.list();}
    @Transactional public void trash(long id,String email){
        var actor=identity.actor(email);identity.recruiter(actor);lock(id);
        if(repository.count(id)>0)return;
        long now=System.currentTimeMillis();
        repository.insert(id,now,now+Duration.ofDays(30).toMillis(),actor.id());
        repository.closeJob(id);
        identity.audit(actor,"vacantes",id,"actualizar","Oferta enviada a papelera por 30 días");
    }
    @Transactional public void restore(long id,String email){
        var actor=identity.actor(email);identity.recruiter(actor);lock(id);
        var expiry=repository.expiry(id);
        if(expiry.isEmpty())throw new ResponseStatusException(NOT_FOUND,"Oferta no disponible en papelera");
        if(expiry.getFirst()<=System.currentTimeMillis())throw new ResponseStatusException(CONFLICT,"El plazo de restauración venció");
        repository.remove(id);
        repository.pauseJob(id);
        identity.audit(actor,"vacantes",id,"actualizar","Oferta restaurada como pausada");
    }
    @Transactional public void purgeExpired(){
        // Serialize with editing/restoration. Bounded batch; each run is atomic.
        repository.lockForPurge();
        var ids=repository.expiredJobs(System.currentTimeMillis());
        for(long id:ids){
            lock(id);
            var applications=repository.lockApplications(id);
            for(long application:applications){
                repository.deleteCriteria(application);
                repository.deleteEvaluations(application);
                repository.deleteInterviews(application);
                repository.deleteTimeline(application);
                repository.deleteDocuments(application);
                repository.deleteApplication(application);
            }
            repository.auditPurge(id);
            repository.removePurged(id);
            repository.deleteJob(id);
        }
    }
}
