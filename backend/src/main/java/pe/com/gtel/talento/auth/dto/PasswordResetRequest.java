package pe.com.gtel.talento.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PasswordResetRequest(@NotBlank @Size(max=100) String token,@NotBlank @Size(min=12,max=72) String password) { @Override public String toString(){return "PasswordReset[REDACTED]";} }
