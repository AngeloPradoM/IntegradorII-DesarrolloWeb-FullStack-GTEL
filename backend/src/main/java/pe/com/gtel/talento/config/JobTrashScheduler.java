package pe.com.gtel.talento.config;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import pe.com.gtel.talento.recruitment.service.JobTrashService;
@Configuration
@EnableScheduling
public class JobTrashScheduler {
    private final JobTrashService service;
    public JobTrashScheduler(JobTrashService service){this.service=service;}
    @Scheduled(initialDelay=60000,fixedDelay=3600000) public void purge(){service.purgeExpired();}
}
