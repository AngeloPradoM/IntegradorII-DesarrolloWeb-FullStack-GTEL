package pe.com.gtel.talento.recruitment.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import pe.com.gtel.talento.recruitment.dto.VacanteResponse;
import pe.com.gtel.talento.recruitment.entity.Departamento;
import pe.com.gtel.talento.recruitment.entity.Vacante;
import pe.com.gtel.talento.recruitment.service.VacanteService;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PublicJobControllerTest {

    final VacanteService service = mock(VacanteService.class);
    final PublicJobController controller = new PublicJobController(service);

    @Test
    void listJobsDelegatesToService() {
        Vacante v = new Vacante();
        v.setId(1L);
        v.setTitulo("Asesor de Ventas");
        v.setSueldoMin(new BigDecimal("1500"));
        v.setSueldoMax(new BigDecimal("2200"));
        v.setTipoJornada("full_time");
        v.setModalidad("presencial");
        v.setSede("Lima, Perú");
        v.setDepartamento(new Departamento(1L, "Ventas", "", "activo"));

        VacanteResponse response = VacanteResponse.fromEntity(v, 2);
        when(service.listPublicJobs("Ventas", null, null, null))
                .thenReturn(List.of(response));

        List<VacanteResponse> result = controller.listJobs("Ventas", null, null, null);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Asesor de Ventas", result.get(0).getTitle());
        assertEquals("Ventas", result.get(0).getDepartment());
    }

    @Test
    void getJobDetailDelegatesToService() {
        Vacante v = new Vacante();
        v.setId(5L);
        v.setTitulo("Soporte Técnico");
        VacanteResponse response = VacanteResponse.fromEntity(v, 0);

        when(service.getPublicJob(5L)).thenReturn(response);

        VacanteResponse result = controller.getJobDetail(5L);
        assertNotNull(result);
        assertEquals("Soporte Técnico", result.getTitle());
    }

    @Test
    void getDepartmentsReturnsList() {
        when(service.listDepartments()).thenReturn(List.of(Map.of("id", 1L, "name", "Ventas")));
        List<Map<String, Object>> depts = controller.getDepartments();
        assertEquals(1, depts.size());
        assertEquals("Ventas", depts.get(0).get("name"));
    }
}
