package pe.com.gtel.talento.recruitment.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ApplicationStateRequest(@NotBlank @Pattern(regexp="recibida|en_revision|entrevista|aprobada|rechazada") String status) {}
