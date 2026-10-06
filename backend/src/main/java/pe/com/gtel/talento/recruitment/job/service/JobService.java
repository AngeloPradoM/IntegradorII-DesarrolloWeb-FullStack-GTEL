package pe.com.gtel.talento.recruitment.job.service;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import pe.com.gtel.talento.identity.service.WorkflowIdentity;
import pe.com.gtel.talento.recruitment.job.dto.JobRequest;
import pe.com.gtel.talento.recruitment.job.repository.JobRepository;
import static org.springframework.http.HttpStatus.*;

@Service
public class JobService {
    private final JobRepository repository;
    private final WorkflowIdentity identity;
    public JobService(JobRepository repository, WorkflowIdentity identity) {this.repository=repository;this.identity=identity;}
    public List<Map<String,Object>> list(boolean publicOnly) {
        var rows=repository.list(publicOnly);
        rows.forEach(this::tags);return rows;
    }
    public Map<String,Object> get(long id, boolean publicOnly) {
        var rows=repository.find(id,publicOnly);
        if(rows.isEmpty())throw new ResponseStatusException(NOT_FOUND,"Oferta no disponible");
        tags(rows.getFirst());return rows.getFirst();
    }
    private void tags(Map<String,Object> row){var value=row.remove("tagsText");row.put("tags",value==null||value.toString().isBlank()?List.of():Arrays.asList(value.toString().split(",")));}
    @Transactional public Map<String,Object> save(Long id,JobRequest r,String email) {
        var actor=identity.actor(email);identity.recruiter(actor);
        String skills=r.tags()==null?"":String.join(",",r.tags());
        if(skills.length()>255)throw new ResponseStatusException(BAD_REQUEST,"Las habilidades no deben superar 255 caracteres");
        if(r.salaryMin().compareTo(r.salaryMax())>0)throw new ResponseStatusException(BAD_REQUEST,"El sueldo máximo debe ser mayor o igual al mínimo");
        if(r.deadline()!=null&&r.deadline().isBefore(LocalDate.now())&&!r.status().equals("cerrada"))
            throw new ResponseStatusException(BAD_REQUEST,"La fecha límite no puede estar en el pasado");
        // Serializes department creation and job edits without changing existing departments.
        repository.lockRecruiterRole();
        var departments=repository.findDepartment(r.department().trim());
        if(departments.isEmpty())repository.insertDepartment(r.department().trim());
        long department=repository.departmentId(r.department().trim());
        if(id==null){
            
            id=repository.insert(r,department,actor.id());
            identity.audit(actor,"vacantes",id,"crear","Creación de vacante");
        }else{
            get(id,false);
            identity.audit(actor,"vacantes",id,"actualizar","Edición de vacante; estado: "+r.status());
        }
        repository.update(id,r,department);
        repository.updateRequirements(id,r,skills);
        return get(id,false);
    }
}
