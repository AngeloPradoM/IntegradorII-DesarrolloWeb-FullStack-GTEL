package pe.com.gtel.talento.recruitment.evaluation.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EvaluationCriterionRequest(@NotBlank @Size(max=100) String area,@Min(0) @Max(100) int score,@Size(max=255) String note) {}
