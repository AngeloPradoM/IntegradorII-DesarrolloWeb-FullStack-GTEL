package pe.com.gtel.talento.recruitment.controller;
import java.security.Principal;
import java.util.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.*;
import pe.com.gtel.talento.recruitment.service.ApplicationService;
@RestController
public class ApplicationController {
    private final ApplicationService service;
    public ApplicationController(ApplicationService service){this.service=service;}
    @GetMapping("/api/candidate/applications") public List<Map<String,Object>> mine(Principal p){return service.list(p.getName(),false);}
    @GetMapping("/api/recruiter/applications") public List<Map<String,Object>> received(Principal p){return service.list(p.getName(),true);}
    @PostMapping(value="/api/candidate/applications/{job}",consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String,Object> apply(@PathVariable long job,@Valid @RequestPart("data") ApplicationService.Personal data,@RequestParam boolean terms,@RequestPart MultipartFile cv,Principal p){return service.apply(job,data,terms,cv,p.getName());}
    @GetMapping("/api/applications/{id}/cv") public ResponseEntity<byte[]> cv(@PathVariable long id,Principal p){return ResponseEntity.ok().contentType(MediaType.APPLICATION_PDF).header("Content-Disposition","attachment; filename=curriculum.pdf").header("Cache-Control","no-store").header("X-Content-Type-Options","nosniff").body(service.document(id,p.getName()));}
    public record State(@NotBlank @Pattern(regexp="recibida|en_revision|entrevista|aprobada|rechazada") String status) {}
    @PutMapping("/api/recruiter/applications/{id}/status") public Map<String,Object> status(@PathVariable long id,@Valid @RequestBody State r,Principal p){return service.status(id,r.status(),p.getName());}
}
