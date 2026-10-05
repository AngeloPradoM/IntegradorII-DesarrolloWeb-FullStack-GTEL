package pe.com.gtel.talento.recruitment.controller;
import java.security.Principal;
import java.util.*;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import pe.com.gtel.talento.recruitment.service.JobService;
import pe.com.gtel.talento.recruitment.dto.JobRequest;
@RestController
public class JobController {
    private final JobService service;
    public JobController(JobService service){this.service=service;}
    @GetMapping("/api/jobs") public List<Map<String,Object>> publicJobs(){return service.list(true);}
    @GetMapping("/api/jobs/{id}") public Map<String,Object> publicJob(@PathVariable long id){return service.get(id,true);}
    @GetMapping("/api/recruiter/jobs") public List<Map<String,Object>> jobs(){return service.list(false);}
    @PostMapping("/api/recruiter/jobs") public Map<String,Object> create(@Valid @RequestBody JobRequest r,Principal p){return service.save(null,r,p.getName());}
    @PutMapping("/api/recruiter/jobs/{id}") public Map<String,Object> update(@PathVariable long id,@Valid @RequestBody JobRequest r,Principal p){return service.save(id,r,p.getName());}
}
