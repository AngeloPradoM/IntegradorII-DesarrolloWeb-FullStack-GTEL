package pe.com.gtel.talento.security;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.web.server.ResponseStatusException;

class AccountAccessServiceTest {
    JdbcTemplate jdbc;
    AccountAccessService access;
    JwtService jwt = new JwtService("test-only-key-with-at-least-32-characters",60000);
    @BeforeEach void setup() {
        jdbc=new JdbcTemplate(new DriverManagerDataSource("jdbc:h2:mem:"+java.util.UUID.randomUUID(),"sa",""));
        jdbc.execute("CREATE TABLE roles(id INT PRIMARY KEY,nombre VARCHAR(30))");
    }
    @Test void bypassRequiresFlagExactAccountRoleAndActiveStatus() {
        var enabled=new AccountAccessService(jdbc,true);
        var disabled=new AccountAccessService(jdbc,false);
        var admin=new AccountAccessService.Account(1,"Administrador@gmail.com","ADMIN",0,true,"activo");
        assertTrue(enabled.bypass(admin));
        assertFalse(disabled.bypass(admin));
        assertFalse(enabled.bypass(new AccountAccessService.Account(1,"other@gmail.com","ADMIN",0,true,"activo")));
        assertFalse(enabled.bypass(new AccountAccessService.Account(1,"administrador@gmail.com","CANDIDATO",0,true,"activo")));
        assertFalse(enabled.bypass(new AccountAccessService.Account(1,admin.email(),"ADMIN",0,false,"activo")));
        assertFalse(enabled.bypass(new AccountAccessService.Account(1,admin.email(),"ADMIN",0,true,"inactivo")));
    }
    @Test void changedVersionRoleOrStatusRejectsPreviouslySignedToken() {
        var ds=new DriverManagerDataSource("jdbc:h2:mem:"+java.util.UUID.randomUUID()+";DB_CLOSE_DELAY=-1","sa","");
        jdbc=new JdbcTemplate(ds);
        jdbc.execute("CREATE TABLE roles(id INT PRIMARY KEY,nombre VARCHAR(30))");
        jdbc.execute("CREATE TABLE usuarios(id BIGINT,email VARCHAR(150),rol_id INT,auth_version INT,otp_exempt BOOLEAN,estado VARCHAR(20))");
        jdbc.update("INSERT INTO roles VALUES(3,'ADMIN')");
        jdbc.update("INSERT INTO usuarios VALUES(1,'administrador@gmail.com',3,0,TRUE,'activo')");
        access=new AccountAccessService(jdbc,true);
        var token=jwt.createToken("administrador@gmail.com","ADMIN",0,"TEST_PASSWORD");
        assertDoesNotThrow(()->access.validate(token,jwt));
        assertThrows(ResponseStatusException.class,()->new AccountAccessService(jdbc,false).validate(token,jwt));
        jdbc.update("UPDATE usuarios SET auth_version=1");
        assertThrows(ResponseStatusException.class,()->access.validate(token,jwt));
        jdbc.update("UPDATE usuarios SET auth_version=0,estado='inactivo'");
        assertThrows(ResponseStatusException.class,()->access.validate(token,jwt));
        jdbc.update("UPDATE usuarios SET estado='activo'");
        jdbc.update("UPDATE roles SET nombre='CANDIDATO'");
        assertThrows(ResponseStatusException.class,()->access.validate(token,jwt));
    }
}
