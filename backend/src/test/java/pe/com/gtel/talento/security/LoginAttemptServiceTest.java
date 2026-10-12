package pe.com.gtel.talento.security;
import java.time.*;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class LoginAttemptServiceTest {
 @Test void budgetNormalizesIdentityAndExpires(){
  Clock clock=mock(Clock.class);when(clock.millis()).thenReturn(0L);var limiter=new LoginAttemptService(clock);
  for(int i=0;i<5;i++)limiter.begin(" Person@example.test ");
  assertEquals(429,assertThrows(ResponseStatusException.class,()->limiter.begin("person@example.test")).getStatusCode().value());
  assertDoesNotThrow(()->limiter.begin("another@example.test"));
  when(clock.millis()).thenReturn(900001L);assertDoesNotThrow(()->limiter.begin("person@example.test"));
 }
 @Test void validPasswordResetsBudget(){var limiter=new LoginAttemptService();for(int i=0;i<5;i++)limiter.begin("a@test.example");limiter.succeeded("a@test.example");assertDoesNotThrow(()->limiter.begin("a@test.example"));}
 @Test void passwordPolicyAccountsForUtf8Bytes(){assertThrows(ResponseStatusException.class,()->PasswordPolicy.validate("short"));assertThrows(ResponseStatusException.class,()->PasswordPolicy.validate("é".repeat(37)));assertDoesNotThrow(()->PasswordPolicy.validate("é".repeat(36)));}
}
