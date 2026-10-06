package pe.com.gtel.talento.audit.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import pe.com.gtel.talento.audit.dto.AuditPageResponse;
import pe.com.gtel.talento.audit.repository.AuditRepository;

@Service
public class AuditService {
    private final AuditRepository repository;

    public AuditService(AuditRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public AuditPageResponse list(int page) {
        if (page < 0 || page > 100000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        }
        return new AuditPageResponse(repository.list(page * 25), repository.count());
    }

    public void record(long actorId, String table, long id, String action, String detail) {
        repository.insert(actorId, table, id, action, detail);
    }
}
