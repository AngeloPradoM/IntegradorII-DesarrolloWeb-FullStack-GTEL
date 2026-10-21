package pe.com.gtel.talento.recruitment.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import pe.com.gtel.talento.identity.entity.Usuario;

@Entity
@Table(name = "vacantes")
public class Vacante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "requerimiento_id")
    private Long requerimientoId;

    @Column(nullable = false, length = 150)
    private String titulo;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "departamento_id", nullable = false)
    private Departamento departamento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reclutador_id", nullable = false)
    private Usuario reclutador;

    @Column(name = "num_vacantes")
    private Integer numVacantes = 1;

    @Column(name = "sueldo_min", precision = 10, scale = 2)
    private BigDecimal sueldoMin;

    @Column(name = "sueldo_max", precision = 10, scale = 2)
    private BigDecimal sueldoMax;

    @Column(name = "tipo_jornada", nullable = false, length = 30)
    private String tipoJornada = "full_time";

    @Column(nullable = false, length = 30)
    private String modalidad = "presencial";

    @Column(length = 150)
    private String sede;

    @Column(name = "fecha_publicacion")
    private LocalDateTime fechaPublicacion;

    @Column(name = "fecha_limite_postulacion")
    private LocalDate fechaLimitePostulacion;

    @Column(name = "fecha_cierre")
    private LocalDate fechaCierre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "nivel_educativo", length = 80)
    private String nivelEducativo;

    @Column(name = "experiencia_minima", length = 80)
    private String experienciaMinima;

    @Column(length = 255)
    private String habilidades;

    @Column(nullable = false, length = 20)
    private String estado = "activa";

    @PrePersist
    public void prePersist() {
        if (fechaPublicacion == null) {
            fechaPublicacion = LocalDateTime.now();
        }
        if (estado == null || estado.isBlank()) {
            estado = "activa";
        }
        if (numVacantes == null || numVacantes < 1) {
            numVacantes = 1;
        }
    }

    public Vacante() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getRequerimientoId() {
        return requerimientoId;
    }

    public void setRequerimientoId(Long requerimientoId) {
        this.requerimientoId = requerimientoId;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public Departamento getDepartamento() {
        return departamento;
    }

    public void setDepartamento(Departamento departamento) {
        this.departamento = departamento;
    }

    public Usuario getReclutador() {
        return reclutador;
    }

    public void setReclutador(Usuario reclutador) {
        this.reclutador = reclutador;
    }

    public Integer getNumVacantes() {
        return numVacantes;
    }

    public void setNumVacantes(Integer numVacantes) {
        this.numVacantes = numVacantes;
    }

    public BigDecimal getSueldoMin() {
        return sueldoMin;
    }

    public void setSueldoMin(BigDecimal sueldoMin) {
        this.sueldoMin = sueldoMin;
    }

    public BigDecimal getSueldoMax() {
        return sueldoMax;
    }

    public void setSueldoMax(BigDecimal sueldoMax) {
        this.sueldoMax = sueldoMax;
    }

    public String getTipoJornada() {
        return tipoJornada;
    }

    public void setTipoJornada(String tipoJornada) {
        this.tipoJornada = tipoJornada;
    }

    public String getModalidad() {
        return modalidad;
    }

    public void setModalidad(String modalidad) {
        this.modalidad = modalidad;
    }

    public String getSede() {
        return sede;
    }

    public void setSede(String sede) {
        this.sede = sede;
    }

    public LocalDateTime getFechaPublicacion() {
        return fechaPublicacion;
    }

    public void setFechaPublicacion(LocalDateTime fechaPublicacion) {
        this.fechaPublicacion = fechaPublicacion;
    }

    public LocalDate getFechaLimitePostulacion() {
        return fechaLimitePostulacion;
    }

    public void setFechaLimitePostulacion(LocalDate fechaLimitePostulacion) {
        this.fechaLimitePostulacion = fechaLimitePostulacion;
    }

    public LocalDate getFechaCierre() {
        return fechaCierre;
    }

    public void setFechaCierre(LocalDate fechaCierre) {
        this.fechaCierre = fechaCierre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getNivelEducativo() {
        return nivelEducativo;
    }

    public void setNivelEducativo(String nivelEducativo) {
        this.nivelEducativo = nivelEducativo;
    }

    public String getExperienciaMinima() {
        return experienciaMinima;
    }

    public void setExperienciaMinima(String experienciaMinima) {
        this.experienciaMinima = experienciaMinima;
    }

    public String getHabilidades() {
        return habilidades;
    }

    public void setHabilidades(String habilidades) {
        this.habilidades = habilidades;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }
}
