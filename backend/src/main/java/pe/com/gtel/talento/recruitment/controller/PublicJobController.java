package pe.com.gtel.talento.recruitment.controller;

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
public class PublicJobController {

    private final VacanteService vacanteService;

    public PublicJobController(VacanteService vacanteService) {
        this.vacanteService = vacanteService;
    }

    @GetMapping
    public List<VacanteResponse> listJobs(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String modality,
            @RequestParam(required = false) String location) {
        return vacanteService.listPublicJobs(search, type, modality, location);
    }

    @GetMapping("/{id}")
    public VacanteResponse getJobDetail(@PathVariable Long id) {
        return vacanteService.getPublicJob(id);
    }

    @GetMapping("/departments")
    public List<Map<String, Object>> getDepartments() {
        return vacanteService.listDepartments();
    }
}
