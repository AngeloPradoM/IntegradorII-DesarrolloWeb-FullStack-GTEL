package pe.com.gtel.talento.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PasswordRecoveryRequest(@NotBlank @Email @Size(max=150) String email) { @Override public String toString(){return "RecoveryRequest[REDACTED]";} }
