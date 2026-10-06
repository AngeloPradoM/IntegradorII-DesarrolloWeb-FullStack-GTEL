package pe.com.gtel.talento.recruitment.evaluation.controller;

import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.com.gtel.talento.recruitment.evaluation.dto.EvaluationRequest;
import pe.com.gtel.talento.recruitment.evaluation.service.EvaluationService;
@RestController
@RequestMapping("/api/recruiter/selection")
public class EvaluationController {
    private final EvaluationService service;
    public EvaluationController(EvaluationService service){this.service=service;}
    @GetMapping("/evaluations") public List<Map<String,Object>> evaluations(){return service.evaluations();}
    @PostMapping("/evaluations") public Map<String,Object> evaluate(@Valid @RequestBody EvaluationRequest r,Principal p){return service.evaluate(r,p.getName());}
}
