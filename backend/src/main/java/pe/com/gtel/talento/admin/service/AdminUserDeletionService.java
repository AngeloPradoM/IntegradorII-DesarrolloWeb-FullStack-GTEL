package pe.com.gtel.talento.admin.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import pe.com.gtel.talento.admin.repository.AdminUserDeletionRepository;
import static org.springframework.http.HttpStatus.*;
@Service
public class AdminUserDeletionService {
    private final AdminUserDeletionRepository repository;
    public AdminUserDeletionService(AdminUserDeletionRepository repository){this.repository=repository;}
    @Transactional public void delete(long id,String email){
        repository.lockAdminRole();
        repository.lockRecruiterRole();
        var actors=repository.activeAdminsByEmail(email);
        if(actors.isEmpty())throw new ResponseStatusException(FORBIDDEN);
        long actor=actors.getFirst();
        if(actor==id)throw new ResponseStatusException(BAD_REQUEST,"No puedes eliminar tu propia cuenta.");
        var users=repository.lockUser(id);
        if(users.isEmpty())throw new ResponseStatusException(NOT_FOUND,"La cuenta ya no existe.");
        var user=users.getFirst();
        long adminRole=repository.adminRole();
        if(((Number)user.get("rol_id")).longValue()==adminRole&&"activo".equals(user.get("estado"))&&repository.activeAdminCount(adminRole)<=1)
            throw new ResponseStatusException(CONFLICT,"Debe quedar un administrador activo.");
        var profiles=repository.lockProfiles(id);
        for(long profile:profiles){
            var applications=repository.lockApplications(profile);
            for(long application:applications){
                repository.deleteCriteria(application);
                repository.deleteEvaluations(application);
                repository.deleteInterviews(application);
                repository.deleteTimeline(application);
                repository.deleteDocuments(application);
                repository.deleteApplication(application);
            }
        }
        // Preserve shared business records, removing all references to the deleted identity.
        repository.transferJobs(actor,id);
        repository.transferRequests(actor,id);
        repository.transferTrash(actor,id);
        repository.detachEvaluations(id);
        repository.detachTimeline(id);
        repository.deleteProfiles(id);
        repository.deleteContacts(id);
        repository.deleteOtp(id);
        repository.deleteRecovery(id);
        repository.deleteNotifications(id);
        repository.preserveAuditActor(id,user.get("email"));
        repository.auditDeletion(id,user.get("email"),actor);
        repository.deleteUser(id);
    }
}
