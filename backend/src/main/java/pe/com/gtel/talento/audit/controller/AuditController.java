package pe.com.gtel.talento.audit.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.com.gtel.talento.audit.dto.AuditPageResponse;
import pe.com.gtel.talento.audit.service.AuditService;

@RestController
@RequestMapping("/api/admin/audit")
@Tag(name = "6. Auditoría y Trazabilidad", description = "Registro inmutable de trazabilidad de acciones operativas realizadas en la plataforma por administradores y usuarios.")
public class AuditController {
    private final AuditService service;

    public AuditController(AuditService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Listar registros de auditoría", description = "Devuelve páginas paginadas de eventos de auditoría: tabla afectada, acción (crear/actualizar/eliminar), usuario y fecha.")
    public AuditPageResponse list(@RequestParam(defaultValue = "0") int page) {
        return service.list(page);
    }
}
