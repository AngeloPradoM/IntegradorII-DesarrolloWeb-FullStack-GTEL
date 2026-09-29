package pe.com.gtel.talento.auth.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.util.Optional;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;
import pe.com.gtel.talento.auth.dto.*;
import pe.com.gtel.talento.identity.entity.*;
import pe.com.gtel.talento.identity.repository.*;
import pe.com.gtel.talento.auth.service.CandidatoService;

class CandidatoServiceTest {
    final UsuarioRepository users = mock(UsuarioRepository.class);
    final PostulanteRepository profiles = mock(PostulanteRepository.class);
    final RolRepository roles = mock(RolRepository.class);
    final PasswordEncoder encoder = mock(PasswordEncoder.class);
    final CandidatoService service = new CandidatoService(users, profiles, roles, encoder);
    final Rol role = new Rol("CANDIDATO", "Candidato");

    @Test void registrationSavesPhoneOnCandidateProfile() {
        when(roles.findByNombre("CANDIDATO")).thenReturn(Optional.of(role));
        when(encoder.encode("password-test")).thenReturn("hashed-password");
        when(users.save(any())).thenAnswer(call -> call.getArgument(0));
        when(profiles.save(any())).thenAnswer(call -> call.getArgument(0));
        service.registrar(new RegistroCandidatoRequest("Ana", "Garcia", "ana@test.com", "password-test", "+51987654321"));
        var saved = ArgumentCaptor.forClass(Postulante.class);
        verify(profiles).save(saved.capture());
        assertEquals("+51987654321", saved.getValue().getTelefono());
        assertEquals("ana@test.com", saved.getValue().getEmail());
    }

    @Test void phoneIsRetrievedOnlyAfterValidPassword() {
        var user = new Usuario("ana@test.com", "hashed-password", role);
        var profile = new Postulante(user, "Ana", "Garcia");
        profile.setTelefono("+51987654321");
        when(users.findByEmailIgnoreCase("ana@test.com")).thenReturn(Optional.of(user));
        var request = new LoginRequest("ana@test.com", "password-test", "CANDIDATO");
        assertThrows(ResponseStatusException.class, () -> service.autenticar(request));
        verifyNoInteractions(profiles);
        when(encoder.matches("password-test", "hashed-password")).thenReturn(true);
        when(profiles.findByUsuarioEmailIgnoreCase("ana@test.com")).thenReturn(Optional.of(profile));
        assertEquals("+51987654321", service.autenticar(request).telefono());
    }

    @Test void registrationRequiresInternationalPhone() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var validator = factory.getValidator();
            for (String phone : new String[] { "", "987654321", "+51abc", "+0123456789" })
                assertFalse(validator.validate(new RegistroCandidatoRequest("Ana", "Garcia", "ana@test.com", "password-test", phone)).isEmpty());
            assertTrue(validator.validate(new RegistroCandidatoRequest("Ana", "Garcia", "ana@test.com", "password-test", "+51987654321")).isEmpty());
        }
    }
}
