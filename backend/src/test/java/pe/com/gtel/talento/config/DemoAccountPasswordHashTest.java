package pe.com.gtel.talento.config;

import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

class DemoAccountPasswordHashTest {
    private final PasswordEncoder passwordEncoder = new PasswordConfig().passwordEncoder();

    @Test
    void schemaHashesMatchTheFourDocumentedDemoPasswords() {
        assertMatches("AdminSecure2026*", "$2a$10$HuJzOUJ3kOibr2tgqYehN.dPuyDNGx4v.GuCcgrvH4CouxVBcAdSe");
        assertMatches("Postulante2026!", "$2a$10$6fW8tUZt15hakazplDpGLer9I2H6NesWSZDFmFLvGa9qPwfxyJgn.");
        assertMatches("Reclutador2026!", "$2a$10$7E6hjIlblEpkBM/tXTyj4.jm2Ye87Kw9HRwB85j9GOCxVT6JsFauS");
        assertMatches("Tecnico2026!", "$2a$10$.Myz/0VVk33hHyRoPv.4jOfoT9Si3N3zpra2zkS7cEh1xYIU6tB0.");
    }

    private void assertMatches(String password, String hash) {
        assertTrue(passwordEncoder.matches(password, hash));
    }
}
