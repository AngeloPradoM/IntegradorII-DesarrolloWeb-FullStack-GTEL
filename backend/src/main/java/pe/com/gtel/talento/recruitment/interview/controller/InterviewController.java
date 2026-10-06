package pe.com.gtel.talento.recruitment.interview.controller;

import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.com.gtel.talento.recruitment.interview.dto.InterviewRequest;
import pe.com.gtel.talento.recruitment.interview.service.InterviewService;
@RestController
@RequestMapping("/api/recruiter/selection")
public class InterviewController {
    private final InterviewService service;
    public InterviewController(InterviewService service){this.service=service;}
    @GetMapping("/interviews") public List<Map<String,Object>> interviews(){return service.interviews();}
    @PostMapping("/interviews") public Map<String,Object> create(@Valid @RequestBody InterviewRequest r,Principal p){return service.interview(null,r,p.getName());}
    @PutMapping("/interviews/{id}") public Map<String,Object> update(@PathVariable long id,@Valid @RequestBody InterviewRequest r,Principal p){return service.interview(id,r,p.getName());}
}
