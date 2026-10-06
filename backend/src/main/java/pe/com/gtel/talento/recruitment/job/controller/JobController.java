package pe.com.gtel.talento.recruitment.job.controller;

import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import pe.com.gtel.talento.recruitment.job.dto.JobRequest;
import pe.com.gtel.talento.recruitment.job.service.JobService;
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
