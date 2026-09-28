package pe.com.gtel.talento.controller;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.web.server.ResponseStatusException;
import pe.com.gtel.talento.dto.*;
import pe.com.gtel.talento.security.JwtService;
import pe.com.gtel.talento.service.*;

class AuthControllerTest {
    final CandidatoService candidates=mock(CandidatoService.class);
    final OtpSessionService sessions=new OtpSessionService(300,5,"test-secret-at-least-32-characters",0,3);
    final WhatsAppService whatsapp=mock(WhatsAppService.class);
    final JwtService jwt=mock(JwtService.class);
    final AuthController controller=new AuthController(candidates,sessions,whatsapp,jwt);
    final LoginRequest request=new LoginRequest("user@test.com","12345678","CANDIDATO");
    void credentials() {
        when(candidates.autenticar(request)).thenReturn(new AuthResponse(7L,"Ana","Garcia","user@test.com","CANDIDATO","+51987654321"));
    }
    @Test void sendsToCandidateAndIssuesJwtOnlyAfterVerification() {
        credentials();
        var body=controller.login(request).getBody();
        assertEquals("OTP_REQUIRED",body.get("status"));
        assertEquals("******4321",body.get("maskedPhone"));
        assertFalse(body.containsKey("otpCode"));
        assertFalse(body.containsKey("token"));
        verifyNoInteractions(jwt);
        var code=ArgumentCaptor.forClass(String.class);
        verify(whatsapp).sendCode(eq("+51987654321"),code.capture());
        String id=(String)body.get("sessionId");
        assertEquals(401,controller.verifyOtp(Map.of("sessionId",id,"otp","000000")).getStatusCode().value());
        verifyNoInteractions(jwt);
        when(jwt.createToken("user@test.com","CANDIDATO")).thenReturn("signed-token");
        assertEquals("signed-token",controller.verifyOtp(Map.of("sessionId",id,"otp",code.getValue())).getBody().get("token"));
        assertEquals(401,controller.verifyOtp(Map.of("sessionId",id,"otp",code.getValue())).getStatusCode().value());
        verify(jwt,times(1)).createToken(anyString(),anyString());
    }
    @Test void resendUsesBoundPhoneAndNewCode() {
        credentials();
        var body=controller.login(request).getBody();
        controller.resendOtp(Map.of("sessionId",(String)body.get("sessionId"),"telefono","+51911112222"));
        var code=ArgumentCaptor.forClass(String.class);
        verify(whatsapp,times(2)).sendCode(eq("+51987654321"),code.capture());
        assertNotEquals(code.getAllValues().get(0),code.getAllValues().get(1));
        verifyNoInteractions(jwt);
    }
    @Test void failureToDeliverDoesNotLeaveUsableChallenge() {
        credentials();
        doThrow(new IllegalStateException("provider failure")).when(whatsapp).sendCode(anyString(),anyString());
        var ex=assertThrows(ResponseStatusException.class,()->controller.login(request));
        assertEquals(502,ex.getStatusCode().value());
        verifyNoInteractions(jwt);
        reset(whatsapp);
        assertEquals(200,controller.login(request).getStatusCode().value());
    }
    @Test void invalidCredentialsNeverSendOtp() {
        when(candidates.autenticar(request)).thenThrow(new ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED));
        assertThrows(ResponseStatusException.class,()->controller.login(request));
        verifyNoInteractions(whatsapp,jwt);
    }
}
