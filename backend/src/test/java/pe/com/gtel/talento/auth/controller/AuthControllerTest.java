package pe.com.gtel.talento.auth.controller;

import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import pe.com.gtel.talento.auth.dto.*;
import pe.com.gtel.talento.auth.service.CandidatoService;
import pe.com.gtel.talento.auth.service.EmailOtpService;
import pe.com.gtel.talento.identity.dto.AccountIdentity;
import pe.com.gtel.talento.security.JwtService;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthControllerTest {
    final CandidatoService candidates=mock(CandidatoService.class);
    final JwtService jwt=mock(JwtService.class);
    final EmailOtpService otp=mock(EmailOtpService.class);
    final pe.com.gtel.talento.security.AccountAccessService access=mock(pe.com.gtel.talento.security.AccountAccessService.class);
    final AuthController controller=new AuthController(candidates,jwt,otp,access);

    @Test void authorizedTestAccountSkipsEmailAfterPasswordValidation() {
        var request=new LoginRequest("administrador@gmail.com","AdminSecure2026*");
        var profile=new AuthResponse(1L,"Admin","",request.email(),"ADMIN",null);
        var account=new pe.com.gtel.talento.identity.dto.AccountIdentity(1,request.email(),"ADMIN",0,true,"activo");
        when(candidates.autenticar(request)).thenReturn(profile);
        when(access.find(request.email())).thenReturn(account);
        when(access.bypass(account)).thenReturn(true);
        when(jwt.createToken(request.email(),"ADMIN",0,"TEST_PASSWORD")).thenReturn("signed-test-token");
        var result=controller.login(request).getBody();
        assertEquals(false,result.get("requiresOtp"));
        assertEquals(true,result.get("otpSkipped"));
        assertEquals(false,result.get("verified"));
        assertEquals("signed-test-token",result.get("token"));
        verifyNoInteractions(otp);
    }

    @Test void passwordOnlyNeverIssuesTokenForEitherRole() {
        for (String role : new String[]{"CANDIDATO","RECLUTADOR"}) {
            var request=new LoginRequest("account@example.test","test-password");
            var profile=new AuthResponse(7L,"Test","User",request.email(),role,null);
            when(candidates.autenticar(request)).thenReturn(profile);
            when(otp.start(profile)).thenReturn(Map.of("requiresOtp",true,"authenticated",false,"sessionId","challenge"));
            var result=controller.login(request).getBody();
            assertEquals(true,result.get("requiresOtp"));
            assertEquals(false,result.get("authenticated"));
            assertFalse(result.containsKey("token"));
        }
        verifyNoInteractions(jwt);
    }
    @Test void verifiedCodeIssuesToken() {
        var id=UUID.randomUUID();
        when(otp.verify(id.toString(),"654321")).thenReturn(new AuthResponse(7L,"Test","User","test@example.test","RECLUTADOR",null));
        when(access.find("test@example.test")).thenReturn(new pe.com.gtel.talento.identity.dto.AccountIdentity(7L,"test@example.test","RECLUTADOR",0,false,"activo"));
        when(jwt.createToken("test@example.test","RECLUTADOR",0,"EMAIL_OTP")).thenReturn("signed-token");
        var result=controller.verify(new OtpRequest(id,"654321")).getBody();
        assertEquals(true,result.get("verified"));
        assertEquals("signed-token",result.get("token"));
    }
    @Test void invalidCodeNeverIssuesToken() {
        var id=UUID.randomUUID();
        when(otp.verify(id.toString(),"000000")).thenThrow(new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        assertThrows(ResponseStatusException.class,()->controller.verify(new OtpRequest(id,"000000")));
        verifyNoInteractions(jwt);
    }
    @Test void badCredentialsNeverProduceToken() {
        var request=new LoginRequest("candidate@example.test","wrong");
        when(candidates.autenticar(request)).thenThrow(new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        assertThrows(ResponseStatusException.class,()->controller.login(request));
        verifyNoInteractions(jwt);
    }
    @Test void meRetrievesCurrentProfileWithoutIssuingToken() {
        when(jwt.getEmail("test-token")).thenReturn("candidate@example.test");
        when(jwt.getRole("test-token")).thenReturn("CANDIDATO");
        when(candidates.obtenerPerfil("candidate@example.test")).thenReturn(new AuthResponse(7L,"Updated","Name","candidate@example.test","CANDIDATO","+51987654321"));
        var result=controller.me("Bearer test-token").getBody();
        assertEquals("Updated",result.get("nombres"));
        assertEquals(true,result.get("authenticated"));
        assertFalse(result.containsKey("token"));
        verify(jwt,never()).createToken(anyString(),anyString());
    }
    @Test void invalidTokenDoesNotQueryDatabase() {
        when(jwt.getEmail("invalid")).thenThrow(new IllegalArgumentException());
        assertThrows(ResponseStatusException.class,()->controller.me("Bearer invalid"));
        assertThrows(ResponseStatusException.class,()->controller.me(null));
        verifyNoInteractions(candidates);
    }
    @Test void changedRoleRequiresNewLogin() {
        when(jwt.getEmail("test-token")).thenReturn("candidate@example.test");
        when(jwt.getRole("test-token")).thenReturn("RECLUTADOR");
        when(candidates.obtenerPerfil("candidate@example.test")).thenReturn(new AuthResponse(7L,"Test","Name","candidate@example.test","CANDIDATO",null));
        assertThrows(ResponseStatusException.class,()->controller.me("Bearer test-token"));
    }
}
