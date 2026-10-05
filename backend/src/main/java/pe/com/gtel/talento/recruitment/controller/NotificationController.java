package pe.com.gtel.talento.recruitment.controller;
import java.security.Principal;
import java.util.*;
import org.springframework.web.bind.annotation.*;
import pe.com.gtel.talento.recruitment.service.*;
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService service;
    private final WorkflowIdentity identity;
    public NotificationController(NotificationService service,WorkflowIdentity identity){this.service=service;this.identity=identity;}
    @GetMapping public List<Map<String,Object>> list(Principal p){return service.list(identity.actor(p.getName()).id());}
    @PutMapping("/{id}/read") public void read(@PathVariable long id,Principal p){service.read(id,identity.actor(p.getName()).id());}
}
