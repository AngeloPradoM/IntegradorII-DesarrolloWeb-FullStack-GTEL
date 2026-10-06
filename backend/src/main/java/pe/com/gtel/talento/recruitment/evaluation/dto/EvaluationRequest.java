package pe.com.gtel.talento.recruitment.evaluation.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.util.List;

public record EvaluationRequest(@Positive long applicationId,@NotBlank @Size(max=100) String test,
        @Min(0) @Max(1440) int minutes,@NotBlank @Pattern(regexp="aprobado|en_revision|no_aprobado") String status,
        @NotEmpty @Size(max=30) List<@Valid EvaluationCriterionRequest> details) {}
