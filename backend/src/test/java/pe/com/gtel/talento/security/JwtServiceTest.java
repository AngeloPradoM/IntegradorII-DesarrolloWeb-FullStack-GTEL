package pe.com.gtel.talento.security;

import static org.junit.jupiter.api.Assertions.*;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;

class JwtServiceTest {
    final String secret="test-only-jwt-key-with-at-least-32-bytes";
    final JwtService service=new JwtService(secret,60_000);
    @Test void acceptsOtpTokensAndRejectsPasswordOnlyTokens() {
        String token=service.createToken("test@example.test","CANDIDATO");
        assertEquals("test@example.test",service.getEmail(token));
        assertEquals("CANDIDATO",service.getRole(token));
        String legacy=Jwts.builder().subject("test@example.test").claim("role","CANDIDATO")
            .expiration(new Date(System.currentTimeMillis()+60_000))
            .signWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8))).compact();
        assertThrows(IllegalArgumentException.class,()->service.getEmail(legacy));
    }
    @Test void rejectsExpiredAndTamperedTokens() {
        String expired=new JwtService(secret,-60_000).createToken("test@example.test","CANDIDATO");
        assertThrows(RuntimeException.class,()->service.getEmail(expired));
        String other=new JwtService("another-test-only-signing-secret-of-32-bytes",60_000).createToken("test@example.test","RECLUTADOR");
        assertThrows(RuntimeException.class,()->service.getRole(other));
    }
}
