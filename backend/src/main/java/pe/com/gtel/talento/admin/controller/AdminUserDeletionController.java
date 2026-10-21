package pe.com.gtel.talento.admin.controller;
import java.security.Principal;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import pe.com.gtel.talento.admin.service.AdminUserDeletionService;
@RestController
public class AdminUserDeletionController {
    private final AdminUserDeletionService service;
    public AdminUserDeletionController(AdminUserDeletionService service){this.service=service;}
    @DeleteMapping("/api/admin/users/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable long id,Principal principal){service.delete(id,principal.getName());}
}
