package pe.com.gtel.talento.incident.dto;

import java.time.LocalDate;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import org.springframework.format.annotation.DateTimeFormat;

public record IncidentReportFilter(
    @Size(max = 120) String query,
    @Pattern(regexp = "NUEVO|EN_DIAGNOSTICO|EN_ATENCION|ESCALADO|RESUELTO|CERRADO") String status,
    @Pattern(regexp = "P1|P2|P3|P4") String priority,
    @Size(max = 50) String categoryCode,
    @Positive Long responsibleId,
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
) {}
