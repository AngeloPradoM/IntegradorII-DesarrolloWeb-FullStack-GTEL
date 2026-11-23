package pe.com.gtel.talento.incident.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import org.springframework.stereotype.Component;

import pe.com.gtel.talento.incident.dto.IncidentIndicatorsResponse;
import pe.com.gtel.talento.incident.dto.IncidentReportFilter;
import pe.com.gtel.talento.incident.dto.IncidentResponse;

@Component
public class IncidentWorkbookExporter {
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final int CELL_LIMIT = 32767;

    public byte[] export(List<IncidentResponse> incidents, IncidentIndicatorsResponse indicators,
                         IncidentReportFilter filter, LocalDateTime generatedAt) {
        try (ByteArrayOutputStream output = new ByteArrayOutputStream();
             ZipOutputStream zip = new ZipOutputStream(output, StandardCharsets.UTF_8)) {
            entry(zip, "[Content_Types].xml", contentTypes());
            entry(zip, "_rels/.rels", rootRelationships());
            entry(zip, "xl/workbook.xml", workbook());
            entry(zip, "xl/_rels/workbook.xml.rels", workbookRelationships());
            entry(zip, "xl/styles.xml", styles());
            entry(zip, "xl/worksheets/sheet1.xml", registrySheet(incidents, generatedAt));
            entry(zip, "xl/worksheets/sheet2.xml", summarySheet(indicators, generatedAt));
            entry(zip, "xl/worksheets/sheet3.xml", informationSheet(filter, incidents.size(), generatedAt));
            zip.finish();
            return output.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("No se pudo generar el archivo XLSX", exception);
        }
    }

    private String registrySheet(List<IncidentResponse> incidents, LocalDateTime now) {
        String[] headers = { "Código", "Título", "Componente", "Tipo", "Módulo", "Categoría",
            "Prioridad", "Estado visible", "Estado interno", "Reportante", "Responsable",
            "Fuente asignación", "Detectado", "Primera atención", "Límite primera atención",
            "Recuperado", "Límite resolución", "Cerrado", "Horas atención", "Horas solución",
            "SLA vencido", "Falla repetida", "Incidente anterior", "Solución aplicada",
            "Causa raíz", "Aprendizaje" };
        StringBuilder xml = sheetStart();
        row(xml, 1, true, (Object[]) headers);
        int row = 2;
        for (IncidentResponse incident : incidents) {
            LocalDateTime resolved = incident.recoveredAt() != null ? incident.recoveredAt() : incident.closedAt();
            row(xml, row++, false,
                incident.code(), incident.title(), incident.component(), incident.type(), incident.moduleCode(),
                value(incident.categoryCode(), incident.suggestedCategory()),
                value(incident.priority(), incident.suggestedPriority()), incident.displayStatus(), incident.status(),
                incident.reporterEmail(), incident.responsibleEmail(), incident.assignmentSource(),
                date(incident.detectedAt()), date(incident.firstAttentionAt()), date(incident.slaFirstAttentionAt()),
                date(incident.recoveredAt()), date(incident.slaResolutionAt()), date(incident.closedAt()),
                hours(incident.detectedAt(), incident.firstAttentionAt()), hours(incident.detectedAt(), resolved),
                overdue(incident, now) ? "Sí" : "No", incident.repeatedFailure() ? "Sí" : "No",
                incident.previousIncidentId(), incident.appliedSolution(), incident.rootCause(), incident.learning());
        }
        return sheetEnd(xml);
    }

    private String summarySheet(IncidentIndicatorsResponse value, LocalDateTime generatedAt) {
        StringBuilder xml = sheetStart();
        int row = 1;
        row(xml, row++, true, "Resumen de incidentes", "Valor");
        row(xml, row++, false, "Generado", date(generatedAt));
        row(xml, row++, false, "Total", value.total());
        row(xml, row++, false, "Abiertos", value.open());
        row(xml, row++, false, "Cerrados", value.closed());
        row(xml, row++, false, "Promedio horas de atención", value.averageAttentionHours());
        row(xml, row++, false, "Promedio horas de solución", value.averageResolutionHours());
        row(xml, row++, false, "Vencidos", value.overdue());
        row(xml, row++, false, "Fallas repetidas", value.repeatedFailures());
        row += 2;
        row(xml, row++, true, "Por categoría", "Cantidad");
        for (var item : value.byCategory()) row(xml, row++, false, item.key(), item.count());
        row++;
        row(xml, row++, true, "Por prioridad", "Cantidad");
        for (var item : value.byPriority()) row(xml, row++, false, item.key(), item.count());
        row++;
        row(xml, row++, true, "Por estado", "Cantidad");
        for (var item : value.byStatus()) row(xml, row++, false, item.key(), item.count());
        return sheetEnd(xml);
    }

    private String informationSheet(IncidentReportFilter filter, int exportedRows, LocalDateTime generatedAt) {
        StringBuilder xml = sheetStart();
        int row = 1;
        row(xml, row++, true, "Información del reporte", "Valor");
        row(xml, row++, false, "Generado", date(generatedAt));
        row(xml, row++, false, "Registros exportados", exportedRows);
        row(xml, row++, false, "Búsqueda", filter == null ? null : filter.query());
        row(xml, row++, false, "Estado", filter == null ? null : filter.status());
        row(xml, row++, false, "Prioridad", filter == null ? null : filter.priority());
        row(xml, row++, false, "Categoría", filter == null ? null : filter.categoryCode());
        row(xml, row++, false, "Responsable ID", filter == null ? null : filter.responsibleId());
        row(xml, row++, false, "Fecha desde", filter == null ? null : filter.fromDate());
        row(xml, row, false, "Fecha hasta", filter == null ? null : filter.toDate());
        return sheetEnd(xml);
    }

    private static StringBuilder sheetStart() {
        return new StringBuilder("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>")
            .append("<worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\">")
            .append("<sheetViews><sheetView workbookViewId=\"0\"/></sheetViews><sheetData>");
    }

    private static String sheetEnd(StringBuilder xml) { return xml.append("</sheetData></worksheet>").toString(); }

    private static void row(StringBuilder xml, int number, boolean header, Object... values) {
        xml.append("<row r=\"").append(number).append("\">");
        for (int index = 0; index < values.length; index++) {
            String reference = column(index + 1) + number;
            Object value = values[index];
            if (value instanceof Number numeric) {
                xml.append("<c r=\"").append(reference).append("\"")
                    .append(header ? " s=\"1\"" : "").append("><v>")
                    .append(numeric).append("</v></c>");
            } else {
                xml.append("<c r=\"").append(reference).append("\" t=\"inlineStr\"")
                    .append(header ? " s=\"1\"" : "").append("><is><t xml:space=\"preserve\">")
                    .append(escape(value == null ? "" : value.toString())).append("</t></is></c>");
            }
        }
        xml.append("</row>");
    }

    private static String column(int number) {
        StringBuilder result = new StringBuilder();
        while (number > 0) { number--; result.insert(0, (char) ('A' + number % 26)); number /= 26; }
        return result.toString();
    }

    private static String escape(String raw) {
        String cleaned = raw.codePoints()
            .filter(value -> value == 9 || value == 10 || value == 13 || value >= 32)
            .limit(CELL_LIMIT)
            .collect(StringBuilder::new, StringBuilder::appendCodePoint, StringBuilder::append)
            .toString();
        return cleaned.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            .replace("\"", "&quot;").replace("'", "&apos;");
    }

    private static String date(LocalDateTime value) { return value == null ? "" : DATE.format(value); }
    private static String value(String primary, String fallback) { return primary == null || primary.isBlank() ? fallback : primary; }
    private static Double hours(LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null || end.isBefore(start)) return null;
        return Math.round(Duration.between(start, end).toSeconds() / 36.0) / 100.0;
    }
    private static boolean overdue(IncidentResponse incident, LocalDateTime now) {
        if (incident.slaResolutionAt() == null) return false;
        LocalDateTime end = incident.recoveredAt() != null ? incident.recoveredAt()
            : incident.closedAt() != null ? incident.closedAt() : now;
        return end.isAfter(incident.slaResolutionAt());
    }

    private static void entry(ZipOutputStream zip, String name, String content) throws IOException {
        zip.putNextEntry(new ZipEntry(name));
        zip.write(content.getBytes(StandardCharsets.UTF_8));
        zip.closeEntry();
    }

    private static String contentTypes() { return """
        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
          <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
          <Default Extension="xml" ContentType="application/xml"/>
          <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
          <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
          <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
          <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
          <Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
        </Types>
        """; }
    private static String rootRelationships() { return """
        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
          <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
        </Relationships>
        """; }
    private static String workbook() { return """
        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
          <sheets><sheet name="Registro" sheetId="1" r:id="rId1"/><sheet name="Indicadores" sheetId="2" r:id="rId2"/><sheet name="Información" sheetId="3" r:id="rId3"/></sheets>
        </workbook>
        """; }
    private static String workbookRelationships() { return """
        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
          <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
          <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
          <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/>
          <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
        </Relationships>
        """; }
    private static String styles() { return """
        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
          <fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
          <fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
          <borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs>
          <cellXfs count="2"><xf fontId="0" fillId="0" borderId="0"/><xf fontId="1" fillId="0" borderId="0" applyFont="1"/></cellXfs>
        </styleSheet>
        """; }
}
