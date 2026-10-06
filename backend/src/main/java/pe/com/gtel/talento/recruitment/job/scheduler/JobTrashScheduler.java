package pe.com.gtel.talento.recruitment.job.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import pe.com.gtel.talento.recruitment.job.service.JobTrashService;
@Component
public class JobTrashScheduler {
    private final JobTrashService service;
    public JobTrashScheduler(JobTrashService service){this.service=service;}
    @Scheduled(initialDelay=60000,fixedDelay=3600000) public void purge(){service.purgeExpired();}
}
