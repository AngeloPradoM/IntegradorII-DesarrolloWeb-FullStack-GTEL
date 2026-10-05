package pe.com.gtel.talento.recruitment.controller;
import java.security.Principal;
import java.util.*;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import pe.com.gtel.talento.recruitment.service.SelectionService;
@RestController
@RequestMapping("/api/recruiter/selection")
public class SelectionController {
    private final SelectionService service;
    public SelectionController(SelectionService service){this.service=service;}
    @GetMapping("/interviews") public List<Map<String,Object>> interviews(){return service.interviews();}
    @PostMapping("/interviews") public Map<String,Object> create(@Valid @RequestBody SelectionService.Interview r,Principal p){return service.interview(null,r,p.getName());}
    @PutMapping("/interviews/{id}") public Map<String,Object> update(@PathVariable long id,@Valid @RequestBody SelectionService.Interview r,Principal p){return service.interview(id,r,p.getName());}
    @GetMapping("/evaluations") public List<Map<String,Object>> evaluations(){return service.evaluations();}
    @PostMapping("/evaluations") public Map<String,Object> evaluate(@Valid @RequestBody SelectionService.Evaluation r,Principal p){return service.evaluate(r,p.getName());}
}
