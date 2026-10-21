package pe.com.gtel.talento.security;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;
import pe.com.gtel.talento.admin.service.AdminUserService;
import pe.com.gtel.talento.admin.dto.UserRequest;

class AdminUserServiceTest {
    JdbcTemplate jdbc;
    AdminUserService service;
    BCryptPasswordEncoder encoder=new BCryptPasswordEncoder(4);
    @BeforeEach void setup() {
        jdbc=new JdbcTemplate(new DriverManagerDataSource("jdbc:h2:mem:"+java.util.UUID.randomUUID()+";MODE=MySQL;DB_CLOSE_DELAY=-1","sa",""));
        jdbc.execute("CREATE TABLE roles(id BIGINT PRIMARY KEY,nombre VARCHAR(30))");
        jdbc.execute("CREATE TABLE usuarios(id BIGINT AUTO_INCREMENT PRIMARY KEY,email VARCHAR(150) UNIQUE,password_hash VARCHAR(100),rol_id BIGINT,estado VARCHAR(20),auth_version INT DEFAULT 0,otp_exempt BOOLEAN DEFAULT FALSE)");
        jdbc.execute("CREATE TABLE postulantes(usuario_id BIGINT UNIQUE,nombres VARCHAR(100),apellidos VARCHAR(100),telefono VARCHAR(20))");
        jdbc.execute("CREATE TABLE auth_email_challenges(usuario_id BIGINT)");
        jdbc.update("INSERT INTO roles VALUES(1,'CANDIDATO'),(2,'RECLUTADOR'),(3,'ADMIN')");
        jdbc.update("INSERT INTO usuarios(email,password_hash,rol_id,estado) VALUES('admin@example.test','hash',3,'activo')");
        service=new AdminUserService(jdbc,encoder);
    }
    UserRequest request(String email,String role,String state,String password) {
        return new UserRequest(email,password,role,state,"Test","User","");
    }
    @Test void createHashesPasswordAndEditRevokesSessionsAndPendingCodes() {
        var created=service.save(null,request("candidate@example.test","CANDIDATO","activo","Temporary2026!"),"admin@example.test");
        String hash=jdbc.queryForObject("SELECT password_hash FROM usuarios WHERE id=?",String.class,created.id());
        assertTrue(encoder.matches("Temporary2026!",hash));
        assertFalse(created.toString().contains(hash));
        jdbc.update("INSERT INTO auth_email_challenges VALUES(?)",created.id());
        service.save(created.id(),request(created.email(),"RECLUTADOR","inactivo",null),"admin@example.test");
        assertEquals(1,jdbc.queryForObject("SELECT auth_version FROM usuarios WHERE id=?",Integer.class,created.id()));
        assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM auth_email_challenges",Integer.class));
        assertEquals(1,jdbc.queryForObject("SELECT COUNT(*) FROM postulantes",Integer.class));
    }
    @Test void protectsOwnAndLastAdministratorAndRejectsDuplicates() {
        assertThrows(ResponseStatusException.class,()->service.save(1L,request("admin@example.test","ADMIN","inactivo",null),"admin@example.test"));
        assertThrows(ResponseStatusException.class,()->service.save(1L,request("admin@example.test","RECLUTADOR","activo",null),"another@example.test"));
        assertThrows(ResponseStatusException.class,()->service.save(null,request("admin@example.test","ADMIN","activo","Temporary2026!"),"admin@example.test"));
    }
}
