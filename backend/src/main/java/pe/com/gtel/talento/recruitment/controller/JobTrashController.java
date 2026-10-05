package pe.com.gtel.talento.recruitment.controller;
import java.security.Principal;
import java.util.*;
import org.springframework.web.bind.annotation.*;
import pe.com.gtel.talento.recruitment.service.JobTrashService;
@RestController
@RequestMapping("/api/recruiter/jobs")
public class JobTrashController {
    private final JobTrashService service;
    public JobTrashController(JobTrashService service){this.service=service;}
    @GetMapping("/trash") public List<Map<String,Object>> list(){return service.list();}
    @DeleteMapping("/{id}") public void trash(@PathVariable long id,Principal p){service.trash(id,p.getName());}
    @PostMapping("/{id}/restore") public void restore(@PathVariable long id,Principal p){service.restore(id,p.getName());}
}
