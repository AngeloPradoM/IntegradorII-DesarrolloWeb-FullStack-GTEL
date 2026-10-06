package pe.com.gtel.talento.admin.controller;

import jakarta.validation.Valid;
import java.security.Principal;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pe.com.gtel.talento.admin.dto.AdminUserPageResponse;
import pe.com.gtel.talento.admin.dto.AdminUserResponse;
import pe.com.gtel.talento.admin.dto.UserRequest;
import pe.com.gtel.talento.admin.service.AdminUserService;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {
    private final AdminUserService service;
    public AdminUserController(AdminUserService service){this.service=service;}
    @GetMapping public AdminUserPageResponse list(@RequestParam(defaultValue="") String search,@RequestParam(defaultValue="0") int page){return service.list(search,page);}
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public AdminUserResponse create(@Valid @RequestBody UserRequest request,Principal actor){return service.save(null,request,actor.getName());}
    @PutMapping("/{id}")
    public AdminUserResponse update(@PathVariable Long id,@Valid @RequestBody UserRequest request,Principal actor){return service.save(id,request,actor.getName());}
}
