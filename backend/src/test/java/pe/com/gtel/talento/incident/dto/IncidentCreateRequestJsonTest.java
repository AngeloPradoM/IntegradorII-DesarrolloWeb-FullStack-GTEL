package pe.com.gtel.talento.incident.dto;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import com.fasterxml.jackson.databind.json.JsonMapper;
import org.junit.jupiter.api.Test;

class IncidentCreateRequestJsonTest {
    @Test
    void acceptsPayloadProducedByTechnicalRegistrationForm() throws Exception {
        var mapper = JsonMapper.builder().findAndAddModules().build();
        var request = mapper.readValue("""
            {
              "title":"Plataforma no disponible",
              "component":"Inicio de sesión",
              "type":"INC_PLATAFORMA_CAIDA",
              "incidentTypeCode":"INC_PLATAFORMA_CAIDA",
              "moduleCode":"AVAILABILITY",
              "description":"El servicio no responde.",
              "scope":"GENERAL",
              "impact":"CRITICO",
              "urgency":"INMEDIATA",
              "essentialProcess":true,
              "workaroundAvailable":false,
              "serviceBlocked":true,
              "repeatedFailure":false,
              "previousIncidentId":null,
              "source":"MANUAL",
              "detectedAt":"2026-11-21T20:15",
              "startedAt":null,
              "recoveredAt":null,
              "confirmDistinctIncident":false,
              "distinctReason":""
            }
            """, IncidentCreateRequest.class);

        assertEquals("INC_PLATAFORMA_CAIDA", request.incidentTypeCode());
        assertEquals("MANUAL", request.source());
        assertNull(request.recoveredAt());
    }
}
