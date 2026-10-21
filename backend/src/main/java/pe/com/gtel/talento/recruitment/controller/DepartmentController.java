package pe.com.gtel.talento.recruitment.controller;

import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.com.gtel.talento.recruitment.service.VacanteService;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {

    private final VacanteService vacanteService;

    public DepartmentController(VacanteService vacanteService) {
        this.vacanteService = vacanteService;
    }

    @GetMapping
    public List<Map<String, Object>> getDepartments() {
        return vacanteService.listDepartments();
    }
}
