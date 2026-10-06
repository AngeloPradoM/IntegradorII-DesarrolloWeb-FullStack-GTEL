package pe.com.gtel.talento.recruitment.application.controller;

import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import pe.com.gtel.talento.recruitment.application.dto.ApplicationPersonalRequest;
import pe.com.gtel.talento.recruitment.application.dto.ApplicationStateRequest;
import pe.com.gtel.talento.recruitment.application.service.ApplicationService;

@RestController
public class ApplicationController {
    private final ApplicationService service;
    public ApplicationController(ApplicationService service){this.service=service;}
    @GetMapping("/api/candidate/applications") public List<Map<String,Object>> mine(Principal p){return service.list(p.getName(),false);}
    @GetMapping("/api/recruiter/applications") public List<Map<String,Object>> received(Principal p){return service.list(p.getName(),true);}
    @PostMapping(value="/api/candidate/applications/{job}",consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String,Object> apply(@PathVariable long job,@Valid @RequestPart("data") ApplicationPersonalRequest data,@RequestParam boolean terms,@RequestPart MultipartFile cv,Principal p){return service.apply(job,data,terms,cv,p.getName());}
    @GetMapping("/api/applications/{id}/cv") public ResponseEntity<byte[]> cv(@PathVariable long id,Principal p){return ResponseEntity.ok().contentType(MediaType.APPLICATION_PDF).header("Content-Disposition","attachment; filename=curriculum.pdf").header("Cache-Control","no-store").header("X-Content-Type-Options","nosniff").body(service.document(id,p.getName()));}

    @PutMapping("/api/recruiter/applications/{id}/status") public Map<String,Object> status(@PathVariable long id,@Valid @RequestBody ApplicationStateRequest r,Principal p){return service.status(id,r.status(),p.getName());}
}
