package pe.com.gtel.talento.recruitment.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.com.gtel.talento.recruitment.dto.VacanteResponse;
import pe.com.gtel.talento.recruitment.service.VacanteService;

@RestController
@RequestMapping("/api/jobs")
@Tag(name = "2. Vacantes Públicas", description = "Endpoints de acceso público para búsqueda, filtrado y detalle de ofertas de empleo activas.")
public class PublicJobController {

    private final VacanteService vacanteService;

    public PublicJobController(VacanteService vacanteService) {
        this.vacanteService = vacanteService;
    }

    @GetMapping
    @Operation(summary = "Listar ofertas laborales públicas", description = "Permite buscar ofertas por texto, tipo de jornada (full_time/part_time), modalidad (remoto/hibrido/presencial) y sede.")
    public List<VacanteResponse> listJobs(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String modality,
            @RequestParam(required = false) String location) {
        return vacanteService.listPublicJobs(search, type, modality, location);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener detalle de vacante", description = "Devuelve información completa de la oferta laboral seleccionada, requisitos y beneficios.")
    public VacanteResponse getJobDetail(@PathVariable Long id) {
        return vacanteService.getPublicJob(id);
    }

    @GetMapping("/departments")
    @Operation(summary = "Listar departamentos técnicos", description = "Devuelve el catálogo de departamentos o áreas de la organización para filtros de vacantes.")
    public List<Map<String, Object>> getDepartments() {
        return vacanteService.listDepartments();
    }
}
