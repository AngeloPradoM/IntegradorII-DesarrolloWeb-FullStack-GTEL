package pe.com.gtel.talento.privacy.dto;

import jakarta.validation.constraints.AssertTrue;

public class AnonymizeRequest {

    @AssertTrue(message = "Debes confirmar expresamente la supresión y anonimización de tus datos conforme a la Ley 29733")
    private Boolean confirmacion;

    private String motivo;

    public AnonymizeRequest() {}

    public AnonymizeRequest(Boolean confirmacion, String motivo) {
        this.confirmacion = confirmacion;
        this.motivo = motivo;
    }

    public Boolean getConfirmacion() { return confirmacion; }
    public void setConfirmacion(Boolean confirmacion) { this.confirmacion = confirmacion; }
    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }
}
