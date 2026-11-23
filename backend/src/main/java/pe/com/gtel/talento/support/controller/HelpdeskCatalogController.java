package pe.com.gtel.talento.support.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.com.gtel.talento.support.dto.HelpdeskCatalogResponse;
import pe.com.gtel.talento.support.service.HelpdeskCatalogService;

@RestController
@RequestMapping("/api/support/catalogs")
public class HelpdeskCatalogController {
    private final HelpdeskCatalogService service;
    public HelpdeskCatalogController(HelpdeskCatalogService service) { this.service=service; }

    @GetMapping
    public HelpdeskCatalogResponse activeCatalogs() { return service.activeCatalogs(); }
}
