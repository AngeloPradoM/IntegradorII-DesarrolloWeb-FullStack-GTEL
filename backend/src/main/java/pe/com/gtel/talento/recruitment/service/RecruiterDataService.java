package pe.com.gtel.talento.recruitment.service;

import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.com.gtel.talento.recruitment.repository.RecruiterDataRepository;

@Service
@Transactional(readOnly = true)
public class RecruiterDataService {
    private final RecruiterDataRepository repository;

    public RecruiterDataService(RecruiterDataRepository repository) {
        this.repository = repository;
    }

    public List<Map<String, Object>> candidates() { return repository.candidates(); }
    public List<Map<String, Object>> interviews() { return repository.interviews(); }
    public List<Map<String, Object>> evaluations() { return repository.evaluations(); }
    public Map<String, Object> dashboard() { return repository.dashboard(); }
}
