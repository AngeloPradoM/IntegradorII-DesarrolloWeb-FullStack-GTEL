package pe.com.gtel.talento.notification.controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.com.gtel.talento.identity.service.WorkflowIdentity;
import pe.com.gtel.talento.notification.service.NotificationService;
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService service;
    private final WorkflowIdentity identity;
    public NotificationController(NotificationService service,WorkflowIdentity identity){this.service=service;this.identity=identity;}
    @GetMapping public List<Map<String,Object>> list(Principal p){return service.list(identity.actor(p.getName()).id());}
    @PutMapping("/{id}/read") public void read(@PathVariable long id,Principal p){service.read(id,identity.actor(p.getName()).id());}
}
