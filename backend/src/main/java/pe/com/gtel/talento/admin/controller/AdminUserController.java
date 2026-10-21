package pe.com.gtel.talento.admin.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.security.Principal;
import java.util.Map;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import pe.com.gtel.talento.admin.service.AdminUserService;
import pe.com.gtel.talento.admin.dto.UserRequest;

@RestController
@RequestMapping("/api/admin/users")
@Tag(name = "7. Gestión de Usuarios y Roles", description = "Endpoints de administración para creación, edición y asignación de roles a cuentas del personal interno.")
public class AdminUserController {
    private final AdminUserService service;

    public AdminUserController(AdminUserService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Listar usuarios del sistema", description = "Devuelve listado paginado de usuarios con búsqueda por nombre o correo electrónico.")
    public Map<String, Object> list(@RequestParam(defaultValue = "") String search, @RequestParam(defaultValue = "0") int page) {
        return service.list(search, page);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Crear nuevo usuario administrativo", description = "Registra una cuenta de personal asignando rol (RECLUTADOR, ADMIN, JEFATURA_SOLICITANTE, ANALISTA_RRHH, ENTREVISTADOR).")
    public AdminUserService.UserView create(@Valid @RequestBody UserRequest request, Principal actor) {
        return service.save(null, request, actor.getName());
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar usuario", description = "Modifica los datos personales, correo, estado o rol de un usuario existente.")
    public AdminUserService.UserView update(@PathVariable Long id, @Valid @RequestBody UserRequest request, Principal actor) {
        return service.save(id, request, actor.getName());
    }
}
