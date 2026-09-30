package pe.com.gtel.talento.auth.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record ResendOtpRequest(@NotNull UUID sessionId) {}
