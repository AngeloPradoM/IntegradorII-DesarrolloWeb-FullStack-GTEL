package pe.com.gtel.talento.recruitment.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class VacanteRequest {

    @NotBlank(message = "El título de la vacante es obligatorio.")
    @Size(max = 150, message = "El título no puede exceder 150 caracteres.")
    @JsonAlias({"title"})
    private String titulo;

    @JsonAlias({"department"})
    private String departamento;

    @JsonAlias({"departmentId"})
    private Long departamentoId;

    @JsonAlias({"vacancies"})
    private Integer numVacantes = 1;

    @JsonAlias({"salaryMin"})
    private BigDecimal sueldoMin;

    @JsonAlias({"salaryMax"})
    private BigDecimal sueldoMax;

    @JsonAlias({"type"})
    private String tipoJornada;

    @JsonAlias({"modality"})
    private String modalidad;

    @JsonAlias({"location"})
    private String sede;

    @JsonAlias({"deadline"})
    private LocalDate fechaLimitePostulacion;

    @NotBlank(message = "La descripción del puesto es obligatoria.")
    @JsonAlias({"description"})
    private String descripcion;

    @JsonAlias({"education"})
    private String nivelEducativo;

    @JsonAlias({"experience"})
    private String experienciaMinima;

    @JsonAlias({"tags"})
    private Object habilidades;

    @JsonAlias({"status"})
    private String estado;

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getDepartamento() {
        return departamento;
    }

    public void setDepartamento(String departamento) {
        this.departamento = departamento;
    }

    public Long getDepartamentoId() {
        return departamentoId;
    }

    public void setDepartamentoId(Long departamentoId) {
        this.departamentoId = departamentoId;
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

    public LocalDate getFechaLimitePostulacion() {
        return fechaLimitePostulacion;
    }

    public void setFechaLimitePostulacion(LocalDate fechaLimitePostulacion) {
        this.fechaLimitePostulacion = fechaLimitePostulacion;
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

    public Object getHabilidades() {
        return habilidades;
    }

    public void setHabilidades(Object habilidades) {
        this.habilidades = habilidades;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String resolveHabilidadesString() {
        if (habilidades == null) return "";
        if (habilidades instanceof List<?> list) {
            return String.join(", ", list.stream().map(Object::toString).filter(s -> !s.isBlank()).toList());
        }
        return habilidades.toString().trim();
    }
}
