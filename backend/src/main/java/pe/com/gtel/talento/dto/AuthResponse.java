package pe.com.gtel.talento.dto;

public record AuthResponse(Long id, String nombres, String apellidos, String email, String rol, String token) {
}
