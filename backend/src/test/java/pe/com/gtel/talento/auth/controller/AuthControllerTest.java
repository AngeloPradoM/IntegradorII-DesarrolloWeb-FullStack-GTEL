package pe.com.gtel.talento.auth.controller;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import pe.com.gtel.talento.auth.dto.*;
import pe.com.gtel.talento.security.JwtService;
import pe.com.gtel.talento.auth.service.CandidatoService;

class AuthControllerTest {
    final CandidatoService candidates=mock(CandidatoService.class);
    final JwtService jwt=mock(JwtService.class);
    final AuthController controller=new AuthController(candidates,jwt);

    @Test void candidateLoginReturnsTokenAndProfileWithoutOtp() {
        var request=new LoginRequest("candidate@example.test","test-password","CANDIDATO");
        when(candidates.autenticar(request)).thenReturn(new AuthResponse(7L,"Test","Candidate",request.email(),"CANDIDATO","+51987654321"));
        when(jwt.createToken(request.email(),"CANDIDATO")).thenReturn("test-token");
        var result=controller.login(request).getBody();
        assertEquals(false,result.get("requiresOtp"));
        assertEquals(7L,result.get("id"));
        assertEquals("Test",result.get("nombres"));
        assertEquals("test-token",result.get("token"));
        assertFalse(result.containsKey("sessionId"));
        assertFalse(result.containsKey("passwordHash"));
    }
    @Test void recruiterDoesNotNeedCandidatePhone() {
        var request=new LoginRequest("recruiter@example.test","test-password","RECLUTADOR");
        when(candidates.autenticar(request)).thenReturn(new AuthResponse(8L,request.email(),"",request.email(),"RECLUTADOR",null));
        when(jwt.createToken(request.email(),"RECLUTADOR")).thenReturn("test-token");
        var result=controller.login(request).getBody();
        assertEquals("RECLUTADOR",result.get("rol"));
        assertNull(result.get("telefono"));
        assertEquals("test-token",result.get("token"));
    }
    @Test void badCredentialsNeverProduceToken() {
        var request=new LoginRequest("candidate@example.test","wrong","CANDIDATO");
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
