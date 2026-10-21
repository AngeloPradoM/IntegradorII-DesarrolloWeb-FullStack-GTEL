package pe.com.gtel.talento.recruitment.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "evaluacion_detalle")
public class EvaluacionDetalle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluacion_id", nullable = false)
    private Evaluacion evaluacion;

    @Column(nullable = false, length = 100)
    private String criterio;

    @Column(nullable = false)
    private Integer puntaje;

    @Column
    private Integer porcentaje;

    @Column(length = 255)
    private String observacion;

    public EvaluacionDetalle() {}

    public EvaluacionDetalle(String criterio, Integer puntaje, Integer porcentaje, String observacion) {
        this.criterio = criterio;
        this.puntaje = puntaje;
        this.porcentaje = porcentaje;
        this.observacion = observacion;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Evaluacion getEvaluacion() { return evaluacion; }
    public void setEvaluacion(Evaluacion evaluacion) { this.evaluacion = evaluacion; }

    public String getCriterio() { return criterio; }
    public void setCriterio(String criterio) { this.criterio = criterio; }

    public Integer getPuntaje() { return puntaje; }
    public void setPuntaje(Integer puntaje) { this.puntaje = puntaje; }

    public Integer getPorcentaje() { return porcentaje; }
    public void setPorcentaje(Integer porcentaje) { this.porcentaje = porcentaje; }

    public String getObservacion() { return observacion; }
    public void setObservacion(String observacion) { this.observacion = observacion; }
}
