package pe.com.gtel.talento.audit.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.com.gtel.talento.audit.dto.AuditPageResponse;
import pe.com.gtel.talento.audit.service.AuditService;
@RestController
@RequestMapping("/api/admin/audit")
public class AuditController {
    private final AuditService service;
    public AuditController(AuditService service){this.service=service;}
    @GetMapping public AuditPageResponse list(@RequestParam(defaultValue="0") int page){
        return service.list(page);
    }
}
