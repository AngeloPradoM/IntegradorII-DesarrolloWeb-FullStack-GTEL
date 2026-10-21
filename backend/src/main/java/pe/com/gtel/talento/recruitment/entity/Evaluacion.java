package pe.com.gtel.talento.recruitment.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import pe.com.gtel.talento.identity.entity.Usuario;

@Entity
@Table(name = "evaluaciones")
public class Evaluacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "postulacion_id", nullable = false)
    private Postulacion postulacion;

    @Column(name = "tipo_evaluacion", nullable = false, length = 100)
    private String tipoEvaluacion;

    @Column(name = "puntaje_total", nullable = false)
    private Integer puntajeTotal;

    @Column(name = "tiempo_min")
    private Integer tiempoMin;

    @Column(nullable = false, length = 30)
    private String resultado; // 'aprobado', 'en_revision', 'no_aprobado'

    @Column(name = "fecha_evaluacion")
    private LocalDate fechaEvaluacion = LocalDate.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @OneToMany(mappedBy = "evaluacion", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EvaluacionDetalle> detalles = new ArrayList<>();

    public Evaluacion() {}

    public Evaluacion(Postulacion postulacion, String tipoEvaluacion, Integer puntajeTotal, Integer tiempoMin, String resultado, Usuario usuario) {
        this.postulacion = postulacion;
        this.tipoEvaluacion = tipoEvaluacion;
        this.puntajeTotal = puntajeTotal;
        this.tiempoMin = tiempoMin;
        this.resultado = resultado;
        this.usuario = usuario;
        this.fechaEvaluacion = LocalDate.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Postulacion getPostulacion() { return postulacion; }
    public void setPostulacion(Postulacion postulacion) { this.postulacion = postulacion; }

    public String getTipoEvaluacion() { return tipoEvaluacion; }
    public void setTipoEvaluacion(String tipoEvaluacion) { this.tipoEvaluacion = tipoEvaluacion; }

    public Integer getPuntajeTotal() { return puntajeTotal; }
    public void setPuntajeTotal(Integer puntajeTotal) { this.puntajeTotal = puntajeTotal; }

    public Integer getTiempoMin() { return tiempoMin; }
    public void setTiempoMin(Integer tiempoMin) { this.tiempoMin = tiempoMin; }

    public String getResultado() { return resultado; }
    public void setResultado(String resultado) { this.resultado = resultado; }

    public LocalDate getFechaEvaluacion() { return fechaEvaluacion; }
    public void setFechaEvaluacion(LocalDate fechaEvaluacion) { this.fechaEvaluacion = fechaEvaluacion; }

    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }

    public List<EvaluacionDetalle> getDetalles() { return detalles; }
    public void setDetalles(List<EvaluacionDetalle> detalles) { this.detalles = detalles; }

    public void addDetalle(EvaluacionDetalle detalle) {
        detalles.add(detalle);
        detalle.setEvaluacion(this);
    }
}
