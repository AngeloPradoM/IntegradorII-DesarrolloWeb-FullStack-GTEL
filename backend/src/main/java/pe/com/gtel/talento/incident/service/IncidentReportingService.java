package pe.com.gtel.talento.incident.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import pe.com.gtel.talento.identity.dto.WorkflowActor;
import pe.com.gtel.talento.identity.service.WorkflowIdentity;
import pe.com.gtel.talento.incident.dto.IncidentIndicatorsResponse;
import pe.com.gtel.talento.incident.dto.IncidentControlResponse;
import pe.com.gtel.talento.incident.dto.IncidentIndicatorsResponse.DimensionCount;
import pe.com.gtel.talento.incident.dto.IncidentReportFilter;
import pe.com.gtel.talento.incident.dto.IncidentResponse;
import pe.com.gtel.talento.incident.repository.ProductionIncidentRepository;

@Service
public class IncidentReportingService {
    private static final int MAX_EXPORT_ROWS = 10_000;
    private static final List<String> PRIORITY_ORDER = List.of("P1", "P2", "P3", "P4", "SIN_PRIORIDAD");
    private static final List<String> STATUS_ORDER = List.of("NUEVO", "EN_DIAGNOSTICO", "EN_ATENCION", "ESCALADO", "RESUELTO", "CERRADO");

    private final ProductionIncidentRepository repository;
    private final IncidentPermissionPolicy permissionPolicy;
    private final WorkflowIdentity identity;
    private final IncidentWorkbookExporter workbook;

    public IncidentReportingService(ProductionIncidentRepository repository,
                                    IncidentPermissionPolicy permissionPolicy,
                                    WorkflowIdentity identity, IncidentWorkbookExporter workbook) {
        this.repository = repository;
        this.permissionPolicy = permissionPolicy;
        this.identity = identity;
        this.workbook = workbook;
    }

    @Transactional(readOnly = true)
    public IncidentIndicatorsResponse indicators(IncidentReportFilter filter, String email) {
        LocalDateTime now = LocalDateTime.now();
        return calculate(filteredRows(actor(email), filter), now);
    }

    @Transactional(readOnly = true)
    public List<IncidentControlResponse> control(String email) {
        WorkflowActor actor = actor(email);
        return "ADMIN".equals(actor.role())
            ? repository.listControlAll()
            : repository.listControlForTechnician(actor.id());
    }

    public ExportedWorkbook export(IncidentReportFilter filter, String email) {
        WorkflowActor actor = actor(email);
        List<IncidentResponse> rows = filteredRows(actor, filter);
        if (rows.size() > MAX_EXPORT_ROWS) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                "La exportaciÃ³n supera 10 000 incidentes. Aplica filtros mÃ¡s especÃ­ficos.");
        }
        LocalDateTime now = LocalDateTime.now();
        byte[] content = workbook.export(rows, calculate(rows, now), filter, now);
        identity.audit(actor, "incidentes_produccion", 0L, "actualizar",
            "ExportaciÃ³n XLSX de incidentes: " + rows.size() + " registros");
        return new ExportedWorkbook(content, "incidentes-produccion-" + now.toLocalDate() + ".xlsx");
    }

    IncidentIndicatorsResponse calculate(List<IncidentResponse> rows, LocalDateTime now) {
        long closed = rows.stream().filter(value -> "CERRADO".equals(value.status())).count();
        long repeated = rows.stream().filter(IncidentResponse::repeatedFailure).count();
        long overdue = rows.stream().filter(value -> overdue(value, now)).count();
        List<Double> attentionHours = durations(rows, true);
        List<Double> resolutionHours = durations(rows, false);
        return new IncidentIndicatorsResponse(rows.size(), rows.size() - closed, closed,
            average(attentionHours), average(resolutionHours), overdue, repeated,
            breakdown(rows, incident -> value(incident.categoryCode(), incident.suggestedCategory()), List.of()),
            breakdown(rows, incident -> value(incident.priority(), incident.suggestedPriority()), PRIORITY_ORDER),
            breakdown(rows, IncidentResponse::displayStatus, STATUS_ORDER));
    }

    private WorkflowActor actor(String email) {
        WorkflowActor actor = identity.actor(email);
        if (!permissionPolicy.canUseOperationalQueue(actor.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permisos para consultar indicadores.");
        }
        return actor;
    }

    private List<IncidentResponse> filteredRows(WorkflowActor actor, IncidentReportFilter filter) {
        List<IncidentResponse> source = "ADMIN".equals(actor.role())
            ? repository.listAll() : repository.listForTechnician(actor.id());
        IncidentReportFilter safe = filter == null ? new IncidentReportFilter(null, null, null, null, null, null, null) : filter;
        String query = normalized(safe.query()).toLowerCase(Locale.ROOT);
        String status = normalized(safe.status());
        String priority = normalized(safe.priority());
        String category = normalized(safe.categoryCode());
        return source.stream().filter(value -> query.isBlank() || contains(value, query))
            .filter(value -> status.isBlank() || status.equals(value.displayStatus()))
            .filter(value -> priority.isBlank() || priority.equals(value(value.priority(), value.suggestedPriority())))
            .filter(value -> category.isBlank() || category.equals(value(value.categoryCode(), value.suggestedCategory())))
            .filter(value -> safe.responsibleId() == null || safe.responsibleId().equals(value.responsibleId()))
            .filter(value -> safe.fromDate() == null || value.detectedAt() != null
                && !value.detectedAt().toLocalDate().isBefore(safe.fromDate()))
            .filter(value -> safe.toDate() == null || value.detectedAt() != null
                && !value.detectedAt().toLocalDate().isAfter(safe.toDate()))
            .toList();
    }

    private static boolean contains(IncidentResponse value, String query) {
        return List.of(value.code(), value.title(), value.component(), value.reporterEmail(),
                value.categoryCode(), value.suggestedCategory())
            .stream().filter(item -> item != null).map(item -> item.toLowerCase(Locale.ROOT))
            .anyMatch(item -> item.contains(query));
    }

    private static List<Double> durations(List<IncidentResponse> rows, boolean attention) {
        List<Double> values = new ArrayList<>();
        for (IncidentResponse incident : rows) {
            LocalDateTime end = attention ? incident.firstAttentionAt()
                : incident.recoveredAt() != null ? incident.recoveredAt() : incident.closedAt();
            if (incident.detectedAt() != null && end != null && !end.isBefore(incident.detectedAt())) {
                values.add(Duration.between(incident.detectedAt(), end).toSeconds() / 3600.0);
            }
        }
        return values;
    }

    private static Double average(List<Double> values) {
        if (values.isEmpty()) return null;
        return Math.round(values.stream().mapToDouble(Double::doubleValue).average().orElse(0) * 100) / 100.0;
    }

    private static boolean overdue(IncidentResponse incident, LocalDateTime now) {
        if (incident.slaResolutionAt() == null) return false;
        LocalDateTime end = incident.recoveredAt() != null ? incident.recoveredAt()
            : incident.closedAt() != null ? incident.closedAt() : now;
        return end.isAfter(incident.slaResolutionAt());
    }

    private static List<DimensionCount> breakdown(List<IncidentResponse> rows,
                                                   java.util.function.Function<IncidentResponse,String> dimension,
                                                   List<String> order) {
        Map<String,Long> counts = new LinkedHashMap<>();
        rows.forEach(value -> counts.merge(normalizedDimension(dimension.apply(value)), 1L, Long::sum));
        Comparator<String> comparator = Comparator.<String>comparingInt(value -> {
            int index = order.indexOf(value); return index < 0 ? Integer.MAX_VALUE : index;
        }).thenComparing(Comparator.naturalOrder());
        return counts.entrySet().stream().sorted(Map.Entry.comparingByKey(comparator))
            .map(value -> new DimensionCount(value.getKey(), value.getValue())).toList();
    }

    private static String normalizedDimension(String value) { return value == null || value.isBlank() ? "SIN_DATOS" : value; }
    private static String normalized(String value) { return value == null ? "" : value.trim(); }
    private static String value(String primary, String fallback) { return primary == null || primary.isBlank() ? fallback : primary; }

    public record ExportedWorkbook(byte[] content, String filename) {}
}
