package pe.com.gtel.talento.changemanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ChangeDecisionRequest(
    boolean approved,
    @NotBlank @Pattern(regexp = "BAJA|MEDIA|ALTA") String riskProbability,
    @NotBlank @Pattern(regexp = "BAJO|MEDIO|ALTO") String riskImpact,
    @Size(max = 2000) String comment,
    @Size(max = 1500) String cabMembers
) {}
