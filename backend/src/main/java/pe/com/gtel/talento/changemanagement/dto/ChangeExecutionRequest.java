package pe.com.gtel.talento.changemanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ChangeExecutionRequest(
    @NotBlank @Size(max = 4000) String evidence,
    @NotBlank @Pattern(regexp = "EXITOSO|PARCIAL|FALLIDO|REVERTIDO") String result,
    @NotBlank @Size(max = 3000) String lessonsLearned
) {}
