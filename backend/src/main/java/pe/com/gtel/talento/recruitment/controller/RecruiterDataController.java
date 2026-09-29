package pe.com.gtel.talento.recruitment.controller;

import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.com.gtel.talento.recruitment.service.RecruiterDataService;

@RestController
@RequestMapping("/api/recruiter")
public class RecruiterDataController {
    private final RecruiterDataService service;

    public RecruiterDataController(RecruiterDataService service) {
        this.service = service;
    }

    @GetMapping("/candidates")
    public List<Map<String, Object>> candidates() { return service.candidates(); }

    @GetMapping("/interviews")
    public List<Map<String, Object>> interviews() { return service.interviews(); }

    @GetMapping("/evaluations")
    public List<Map<String, Object>> evaluations() { return service.evaluations(); }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() { return service.dashboard(); }
}
