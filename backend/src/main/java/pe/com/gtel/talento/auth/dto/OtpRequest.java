package pe.com.gtel.talento.auth.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.util.UUID;

public record OtpRequest(@NotNull UUID sessionId, @NotNull @Pattern(regexp = "[0-9]{6}") String otp) {
    @Override public String toString() { return "OtpRequest[REDACTED]"; }
}
