package pe.com.gtel.talento.recruitment.interview.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalTime;

public record InterviewRequest(@Positive long applicationId,@NotNull LocalDate date,@NotNull LocalTime time,
        @Min(10) @Max(240) int minutes,@NotBlank @Pattern(regexp="video|presencial") String type,
        @NotBlank @Size(max=255) String location,@NotBlank @Pattern(regexp="programada|realizada|cancelada") String status) {}
