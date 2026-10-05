package pe.com.gtel.talento.recruitment.controller;
import java.security.Principal;
import java.util.Map;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import pe.com.gtel.talento.recruitment.service.ProfileService;
@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    private final ProfileService service;
    public ProfileController(ProfileService service){this.service=service;}
    @GetMapping public Map<String,Object> get(Principal p){return service.get(p.getName());}
    @PutMapping public Map<String,Object> save(Principal p,@Valid @RequestBody ProfileService.Profile r){return service.save(p.getName(),r);}
}
