package pe.com.gtel.talento.admin.controller;

import java.security.Principal;
import java.util.Map;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import pe.com.gtel.talento.admin.service.AdminUserService;
import pe.com.gtel.talento.admin.dto.UserRequest;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {
    private final AdminUserService service;
    public AdminUserController(AdminUserService service){this.service=service;}
    @GetMapping public Map<String,Object> list(@RequestParam(defaultValue="") String search,@RequestParam(defaultValue="0") int page){return service.list(search,page);}
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public AdminUserService.UserView create(@Valid @RequestBody UserRequest request,Principal actor){return service.save(null,request,actor.getName());}
    @PutMapping("/{id}")
    public AdminUserService.UserView update(@PathVariable Long id,@Valid @RequestBody UserRequest request,Principal actor){return service.save(id,request,actor.getName());}
}
