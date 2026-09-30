package pe.com.gtel.talento.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {
    private final SecretKey key;
    private final long expirationMs;

    public JwtService(@Value("${jwt.secret}") String secret, @Value("${jwt.expiration-ms}") long expirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String createToken(String email, String role) {
        return createToken(email, role, 0, "EMAIL_OTP");
    }

    public String createToken(String email, String role, int version, String method) {
        Date now = new Date();
        return Jwts.builder().subject(email).claim("role", role).claim("authMethod", method).claim("authVersion", version).issuedAt(now)
                .expiration(new Date(now.getTime() + expirationMs)).signWith(key).compact();
    }

    private io.jsonwebtoken.Claims verifiedClaims(String token) {
        var claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
        if ((!"EMAIL_OTP".equals(claims.get("authMethod",String.class)) && !"TEST_PASSWORD".equals(claims.get("authMethod",String.class))) || claims.get("authVersion",Integer.class)==null)
            throw new IllegalArgumentException("Inicia sesión con verificación de correo");
        return claims;
    }

    public int getVersion(String token) { return verifiedClaims(token).get("authVersion",Integer.class); }
    public String getMethod(String token) { return verifiedClaims(token).get("authMethod",String.class); }

    public String getEmail(String token) {
        return verifiedClaims(token).getSubject();
    }

    public String getRole(String token) {
        return verifiedClaims(token).get("role", String.class);
    }
}
