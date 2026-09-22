package pe.com.gtel.talento.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import pe.com.gtel.talento.dto.*;
import pe.com.gtel.talento.entity.Postulante;
import pe.com.gtel.talento.entity.Rol;
import pe.com.gtel.talento.entity.Usuario;
import pe.com.gtel.talento.repository.PostulanteRepository;
import pe.com.gtel.talento.repository.RolRepository;
import pe.com.gtel.talento.repository.UsuarioRepository;
import pe.com.gtel.talento.security.JwtService;

@Service
public class CandidatoService {

    private final UsuarioRepository usuarioRepository;
    private final PostulanteRepository postulanteRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public CandidatoService(UsuarioRepository usuarioRepository, PostulanteRepository postulanteRepository,
                             RolRepository rolRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.usuarioRepository = usuarioRepository;
        this.postulanteRepository = postulanteRepository;
        this.rolRepository = rolRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public CandidatoResponse registrar(RegistroCandidatoRequest request) {
        if (usuarioRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ese correo ya está registrado");
        }

        Rol rolCandidato = rolRepository.findByNombre("CANDIDATO")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Rol CANDIDATO no existe en la BD"));

        Usuario usuario = new Usuario(request.email(), passwordEncoder.encode(request.password()), rolCandidato);
        usuario = usuarioRepository.save(usuario);

        Postulante postulante = new Postulante(usuario, request.nombres(), request.apellidos());
        postulante = postulanteRepository.save(postulante);

        return new CandidatoResponse(postulante.getId(), postulante.getNombres(), postulante.getApellidos(), usuario.getEmail());
    }

    public AuthResponse autenticar(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales inválidas"));

        if (!passwordEncoder.matches(request.password(), usuario.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales inválidas");
        }

        if (!usuario.getRolNombre().equalsIgnoreCase(request.rol())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "El rol seleccionado no coincide con tu cuenta");
        }

        // TODO: cuando se agregue nombres/apellidos a `usuarios`, usar eso directamente
        // para RECLUTADOR en vez de este placeholder.
        String nombres = usuario.getEmail();
        String apellidos = "";
        if ("CANDIDATO".equalsIgnoreCase(usuario.getRolNombre())) {
            Postulante postulante = postulanteRepository.findByUsuarioEmailIgnoreCase(usuario.getEmail())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Perfil de candidato no encontrado"));
            nombres = postulante.getNombres();
            apellidos = postulante.getApellidos();
        }

        String token = jwtService.createToken(usuario.getEmail(), usuario.getRolNombre());
        return new AuthResponse(usuario.getId(), nombres, apellidos, usuario.getEmail(), usuario.getRolNombre(), token);
    }
}