package pe.com.gtel.talento.recruitment.evaluation.service;

import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.com.gtel.talento.identity.service.WorkflowIdentity;
import pe.com.gtel.talento.recruitment.application.service.ApplicationService;
import pe.com.gtel.talento.recruitment.evaluation.dto.EvaluationCriterionRequest;
import pe.com.gtel.talento.recruitment.evaluation.dto.EvaluationRequest;
import pe.com.gtel.talento.recruitment.evaluation.repository.EvaluationRepository;
import static org.springframework.http.HttpStatus.*;

@Service
public class EvaluationService {

    private final EvaluationRepository repository;
    private final WorkflowIdentity identity;
    private final ApplicationService applications;
    public EvaluationService(EvaluationRepository repository,WorkflowIdentity identity,ApplicationService applications){this.repository=repository;this.identity=identity;this.applications=applications;}
    public List<Map<String,Object>> evaluations(){
        var rows=repository.evaluations();
        for(var row:rows)row.put("details",repository.criteria(row.get("id")));return rows;
    }
    @Transactional public Map<String,Object> evaluate(EvaluationRequest r,String email){
        var actor=identity.actor(email);identity.recruiter(actor);applications.get(r.applicationId(),email);
        int score=(int)Math.round(r.details().stream().mapToInt(EvaluationCriterionRequest::score).average().orElseThrow());
        long id=repository.insertEvaluation(r,score,actor.id());
        for(var criterion:r.details())repository.insertCriterion(id,criterion);
        repository.updateScore(r.applicationId(),score);
        identity.audit(actor,"evaluaciones",id,"crear","Evaluación registrada");
        return evaluations().stream().filter(x->((Number)x.get("id")).longValue()==id).findFirst().orElseThrow();
    }
}
