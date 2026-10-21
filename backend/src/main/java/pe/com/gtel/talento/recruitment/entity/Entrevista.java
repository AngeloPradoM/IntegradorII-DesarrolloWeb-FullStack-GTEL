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
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "entrevistas")
public class Entrevista {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "postulacion_id", nullable = false)
    private Postulacion postulacion;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(nullable = false)
    private LocalTime hora;

    @Column(name = "duracion_min")
    private Integer duracionMin = 30;

    @Column(nullable = false, length = 20)
    private String tipo; // 'video' o 'presencial'

    @Column(length = 255)
    private String ubicacion;

    @Column(length = 20)
    private String estado = "programada"; // 'programada', 'realizada', 'cancelada'

    public Entrevista() {}

    public Entrevista(Postulacion postulacion, LocalDate fecha, LocalTime hora, Integer duracionMin, String tipo, String ubicacion) {
        this.postulacion = postulacion;
        this.fecha = fecha;
        this.hora = hora;
        this.duracionMin = duracionMin != null ? duracionMin : 30;
        this.tipo = tipo != null ? tipo : "video";
        this.ubicacion = ubicacion;
        this.estado = "programada";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Postulacion getPostulacion() { return postulacion; }
    public void setPostulacion(Postulacion postulacion) { this.postulacion = postulacion; }

    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }

    public LocalTime getHora() { return hora; }
    public void setHora(LocalTime hora) { this.hora = hora; }

    public Integer getDuracionMin() { return duracionMin; }
    public void setDuracionMin(Integer duracionMin) { this.duracionMin = duracionMin; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public String getUbicacion() { return ubicacion; }
    public void setUbicacion(String ubicacion) { this.ubicacion = ubicacion; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
}
