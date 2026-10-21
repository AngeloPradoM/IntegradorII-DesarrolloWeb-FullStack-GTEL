package pe.com.gtel.talento.recruitment.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import pe.com.gtel.talento.identity.entity.Postulante;

@Entity
@Table(name = "postulaciones")
public class Postulacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 30, unique = true)
    private String codigo;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "postulante_id", nullable = false)
    private Postulante postulante;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "vacante_id", nullable = false)
    private Vacante vacante;

    @Column(name = "puntaje_general")
    private Integer puntajeGeneral;

    @Column(length = 20)
    private String estado = "recibida";

    @Column(name = "fecha_postulacion", nullable = false)
    private LocalDateTime fechaPostulacion;

    @Column(name = "cv_url", length = 255)
    private String cvUrl;

    @Column(name = "cv_nombre", length = 255)
    private String cvNombre;

    @OneToMany(mappedBy = "postulacion", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("fechaCambio ASC")
    private List<PostulacionTimeline> timeline = new ArrayList<>();

    public Postulacion() {}

    public Postulacion(String codigo, Postulante postulante, Vacante vacante, String cvUrl, String cvNombre) {
        this.codigo = codigo;
        this.postulante = postulante;
        this.vacante = vacante;
        this.cvUrl = cvUrl;
        this.cvNombre = cvNombre;
        this.estado = "recibida";
        this.fechaPostulacion = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }

    public Postulante getPostulante() { return postulante; }
    public void setPostulante(Postulante postulante) { this.postulante = postulante; }

    public Vacante getVacante() { return vacante; }
    public void setVacante(Vacante vacante) { this.vacante = vacante; }

    public Integer getPuntajeGeneral() { return puntajeGeneral; }
    public void setPuntajeGeneral(Integer puntajeGeneral) { this.puntajeGeneral = puntajeGeneral; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public LocalDateTime getFechaPostulacion() { return fechaPostulacion; }
    public void setFechaPostulacion(LocalDateTime fechaPostulacion) { this.fechaPostulacion = fechaPostulacion; }

    public String getCvUrl() { return cvUrl; }
    public void setCvUrl(String cvUrl) { this.cvUrl = cvUrl; }

    public String getCvNombre() { return cvNombre; }
    public void setCvNombre(String cvNombre) { this.cvNombre = cvNombre; }

    public List<PostulacionTimeline> getTimeline() { return timeline; }
    public void setTimeline(List<PostulacionTimeline> timeline) { this.timeline = timeline; }

    public void addTimelineEvent(PostulacionTimeline event) {
        timeline.add(event);
        event.setPostulacion(this);
    }
}
