package pe.com.gtel.talento.changemanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangeTechnicalReviewRequest(
    @NotBlank @Size(max = 3000) String technicalEvaluation,
    @NotBlank @Size(max = 5000) String implementationPlan,
    @NotBlank @Size(max = 3000) String testPlan,
    @NotBlank @Size(max = 3000) String rollbackPlan,
    @NotBlank @Size(max = 3000) String communicationPlan
) {}
