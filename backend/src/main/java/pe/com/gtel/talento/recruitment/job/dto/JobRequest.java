package pe.com.gtel.talento.recruitment.job.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record JobRequest(
    @NotBlank @Size(max=150) String title,
    @NotBlank @Size(max=10000) String description,
    @NotBlank @Size(max=80) String department,
    @NotBlank @Size(max=150) String location,
    @NotBlank @Pattern(regexp="full_time|part_time|por_turnos|freelance") String type,
    @NotBlank @Pattern(regexp="presencial|remoto|hibrido") String modality,
    @NotNull @DecimalMin("0") @DecimalMax("99999999.99") BigDecimal salaryMin,
    @NotNull @DecimalMin("0") @DecimalMax("99999999.99") BigDecimal salaryMax,
    @Min(1) @Max(1000) int vacancies,
    @NotBlank @Pattern(regexp="activa|pausada|cerrada") String status,
    LocalDate deadline,
    @Size(max=80) String education,
    @Size(max=80) String experience,
    @Size(max=15) java.util.List<@NotBlank @Size(max=80) String> tags
) {}
