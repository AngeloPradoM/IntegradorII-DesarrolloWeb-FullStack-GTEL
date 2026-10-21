package pe.com.gtel.talento.recruitment.job.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.com.gtel.talento.recruitment.job.service.JobTrashService;

@RestController
@RequestMapping("/api/recruiter/jobs")
@Tag(name = "5. Papelera de Vacantes", description = "Gestión de vacantes eliminadas con retención temporal (soft-delete) y restauración.")
public class JobTrashController {
    private final JobTrashService service;

    public JobTrashController(JobTrashService service) {
        this.service = service;
    }

    @GetMapping("/trash")
    @Operation(summary = "Listar vacantes en papelera", description = "Devuelve las ofertas enviadas a la papelera con su fecha de vencimiento para eliminación definitiva.")
    public List<Map<String, Object>> list() {
        return service.list();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Mover vacante a papelera", description = "Envía la vacante especificada a la papelera temporal sin borrar sus datos.")
    public void trash(@PathVariable long id, Principal p) {
        service.trash(id, p.getName());
    }

    @PostMapping("/{id}/restore")
    @Operation(summary = "Restaurar vacante desde papelera", description = "Restaura una vacante de la papelera dejándola en estado 'pausada' para su posterior reactivación.")
    public void restore(@PathVariable long id, Principal p) {
        service.restore(id, p.getName());
    }
}
