package pe.com.gtel.talento.admin.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.security.Principal;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import pe.com.gtel.talento.admin.service.AdminUserDeletionService;

@RestController
@Tag(name = "7. Gestión de Usuarios y Roles", description = "Endpoints de administración para creación, edición y asignación de roles a cuentas del personal interno.")
public class AdminUserDeletionController {
    private final AdminUserDeletionService service;

    public AdminUserDeletionController(AdminUserDeletionService service) {
        this.service = service;
    }

    @DeleteMapping("/api/admin/users/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Eliminar o revocar usuario", description = "Desactiva o revoca el acceso del usuario registrando el motivo y evento de auditoría.")
    public void delete(@PathVariable long id, Principal principal) {
        service.delete(id, principal.getName());
    }
}
