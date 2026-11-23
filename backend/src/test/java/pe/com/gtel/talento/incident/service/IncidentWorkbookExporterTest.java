package pe.com.gtel.talento.incident.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipInputStream;

import javax.xml.parsers.DocumentBuilderFactory;

import org.junit.jupiter.api.Test;

import pe.com.gtel.talento.incident.dto.IncidentIndicatorsResponse;
import pe.com.gtel.talento.incident.dto.IncidentIndicatorsResponse.DimensionCount;
import pe.com.gtel.talento.incident.dto.IncidentReportFilter;
import pe.com.gtel.talento.incident.dto.IncidentResponse;

class IncidentWorkbookExporterTest {
    @Test
    void createsThreeSheetXlsxWithFiltersAndNeutralizesFormulaLikeUserText() throws Exception {
        LocalDateTime now = LocalDateTime.of(2026, 11, 19, 12, 0);
        IncidentResponse incident = incident("=HYPERLINK(\"https://evil.invalid\")", now);
        IncidentIndicatorsResponse indicators = new IncidentIndicatorsResponse(1, 1, 0, 1.0, null,
            0, 0, List.of(new DimensionCount("INTERFAZ", 1)),
            List.of(new DimensionCount("P3", 1)), List.of(new DimensionCount("EN_DIAGNOSTICO", 1)));

        var filter = new IncidentReportFilter("=consulta", "EN_DIAGNOSTICO", "P3", "INTERFAZ",
            22L, now.toLocalDate().minusDays(1), now.toLocalDate());
        byte[] content = new IncidentWorkbookExporter().export(List.of(incident), indicators, filter, now);
        Map<String,String> entries = unzip(content);

        assertEquals('P', content[0]);
        assertEquals('K', content[1]);
        assertTrue(entries.get("xl/workbook.xml").contains("name=\"Registro\""));
        assertTrue(entries.get("xl/workbook.xml").contains("name=\"Indicadores\""));
        assertTrue(entries.get("xl/workbook.xml").contains("name=\"Información\""));
        String registry = entries.get("xl/worksheets/sheet1.xml");
        assertTrue(registry.contains("t=\"inlineStr\""));
        assertTrue(registry.contains("=HYPERLINK(&quot;https://evil.invalid&quot;)"));
        assertFalse(registry.contains("<f>"));
        assertTrue(entries.get("xl/worksheets/sheet2.xml").contains("Promedio horas de atención"));
        String information = entries.get("xl/worksheets/sheet3.xml");
        assertTrue(information.contains("Registros exportados"));
        assertTrue(information.contains("=consulta"));
        assertFalse(information.contains("<f>"));
        var parser = DocumentBuilderFactory.newInstance().newDocumentBuilder();
        for (var entry : entries.entrySet()) if (entry.getKey().endsWith(".xml")) {
            parser.parse(new ByteArrayInputStream(entry.getValue().getBytes(StandardCharsets.UTF_8)));
        }
    }

    private static Map<String,String> unzip(byte[] content) throws Exception {
        Map<String,String> entries = new HashMap<>();
        try (ZipInputStream zip = new ZipInputStream(new ByteArrayInputStream(content), StandardCharsets.UTF_8)) {
            for (var entry = zip.getNextEntry(); entry != null; entry = zip.getNextEntry()) {
                entries.put(entry.getName(), new String(zip.readAllBytes(), StandardCharsets.UTF_8));
            }
        }
        return entries;
    }

    private IncidentResponse incident(String title, LocalDateTime now) {
        return new IncidentResponse(1L, "INC-1", title, "Frontend", "ERROR", "MANUAL", "WEB", null, "UI",
            "INTERFAZ", "INTERFAZ", "", "Detalle", "LIMITADO", "MEDIO", "MEDIA",
            false, true, false, "P3", "P3", "EN_INVESTIGACION", "EN_DIAGNOSTICO", false,
            1L, "admin@gtel.test", 1L, "admin@gtel.test", 22L, "tech@gtel.test", "MANUAL", null, now.minusHours(1),
            null, null, now.minusHours(2), null, now.minusHours(1), null, null, null,
            null, null, null, false, null, now, now.plusHours(4), 2, now.minusHours(2), now);
    }
}
