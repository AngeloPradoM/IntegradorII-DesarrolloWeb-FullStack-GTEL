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
        jdbc.execute("CREATE TABLE recuperacion_acceso(usuario_id BIGINT)");
        jdbc.execute("CREATE TABLE perfiles_contacto(usuario_id BIGINT PRIMARY KEY,nombres VARCHAR(100),apellidos VARCHAR(100),telefono VARCHAR(20))");
        jdbc.execute("CREATE TABLE auditoria(tabla_afectada VARCHAR(50),registro_id BIGINT,accion VARCHAR(20),detalle VARCHAR(255),usuario_id BIGINT)");
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
        String detail=jdbc.queryForObject("SELECT detalle FROM auditoria WHERE accion='actualizar'",String.class);
        assertTrue(detail.contains("CANDIDATO -> RECLUTADOR"));
        assertTrue(detail.contains("desactivación: activo -> inactivo"));
        assertFalse(detail.contains("Temporary2026!"));
        assertEquals(1L,jdbc.queryForObject("SELECT usuario_id FROM auditoria WHERE accion='actualizar'",Long.class));
    }
    @Test void administrativeEditKeepsContactProfileConsistent() {
        var created=service.save(null,request("candidate@example.test","CANDIDATO","activo","Temporary2026!"),"admin@example.test");
        jdbc.update("INSERT INTO perfiles_contacto VALUES(?,'Anterior','Anterior','123')",created.id());
        service.save(created.id(),new UserRequest(created.email(),null,"CANDIDATO","activo","Nombre","Actualizado","+51987654321"),"admin@example.test");
        assertEquals("Nombre",jdbc.queryForObject("SELECT nombres FROM perfiles_contacto WHERE usuario_id=?",String.class,created.id()));
        assertEquals("+51987654321",jdbc.queryForObject("SELECT telefono FROM perfiles_contacto WHERE usuario_id=?",String.class,created.id()));
    }
    @Test void protectsOwnAndLastAdministratorAndRejectsDuplicates() {
        assertThrows(ResponseStatusException.class,()->service.save(1L,request("admin@example.test","ADMIN","inactivo",null),"admin@example.test"));
        jdbc.update("INSERT INTO usuarios(email,password_hash,rol_id,estado) VALUES('another@example.test','hash',3,'inactivo')");
        assertThrows(ResponseStatusException.class,()->service.save(1L,request("admin@example.test","RECLUTADOR","activo",null),"another@example.test"));
        assertThrows(ResponseStatusException.class,()->service.save(null,request("admin@example.test","ADMIN","activo","Temporary2026!"),"admin@example.test"));
    }
}
