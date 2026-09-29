package pe.com.gtel.talento.auth.dto;

public record AuthResponse(Long id, String nombres, String apellidos, String email, String rol, String telefono) {
}
