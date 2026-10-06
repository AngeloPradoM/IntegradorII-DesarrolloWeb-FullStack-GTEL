package pe.com.gtel.talento.identity.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import pe.com.gtel.talento.identity.dto.WorkflowActor;
import pe.com.gtel.talento.identity.repository.WorkflowIdentityRepository;

@Service
public class WorkflowIdentity {
    private final WorkflowIdentityRepository repository;
    private final pe.com.gtel.talento.audit.service.AuditService audit;
    public WorkflowIdentity(WorkflowIdentityRepository repository, pe.com.gtel.talento.audit.service.AuditService audit) { this.repository = repository; this.audit = audit; }

    public WorkflowActor actor(String email) {
        return repository.findActive(email).stream().findFirst()
            .orElseThrow(()->new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }
    public void recruiter(WorkflowActor actor) {
        if (!"ADMIN".equals(actor.role()) && !"RECLUTADOR".equals(actor.role()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }
    public void audit(WorkflowActor actor, String table, long id, String action, String detail) {
        audit.record(actor.id(),table,id,action,detail);
    }
}
