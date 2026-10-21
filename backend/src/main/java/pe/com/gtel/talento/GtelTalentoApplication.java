package pe.com.gtel.talento;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class GtelTalentoApplication {
    public static void main(String[] args) {
        SpringApplication.run(GtelTalentoApplication.class, args);
    }
}
