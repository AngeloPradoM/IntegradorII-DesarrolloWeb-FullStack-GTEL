package pe.com.gtel.talento.profile.controller;

import jakarta.validation.Valid;
import java.security.Principal;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.com.gtel.talento.profile.dto.ProfileRequest;
import pe.com.gtel.talento.profile.service.ProfileService;
@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    private final ProfileService service;
    public ProfileController(ProfileService service){this.service=service;}
    @GetMapping public Map<String,Object> get(Principal p){return service.get(p.getName());}
    @PutMapping public Map<String,Object> save(Principal p,@Valid @RequestBody ProfileRequest r){return service.save(p.getName(),r);}
}
