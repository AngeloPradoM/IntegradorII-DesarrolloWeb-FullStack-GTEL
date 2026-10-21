package pe.com.gtel.talento.identity.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "postulantes")
public class Postulante {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "usuario_id", nullable = false, unique = true)
    private Usuario usuario;

    @Column(nullable = false, length = 100)
    private String nombres;

    @Column(nullable = false, length = 100)
    private String apellidos;

    @Column(length = 8)
    private String dni;

    @Column(length = 16)
    private String telefono;

    @Column(name = "fecha_nacimiento")
    private LocalDate fechaNacimiento;

    @Column(name = "cv_url", length = 255)
    private String cvUrl;

    @Column(columnDefinition = "TEXT")
    private String experiencia;

    @Column(columnDefinition = "TEXT")
    private String educacion;

    @Column(length = 20)
    private String estado = "activo";

    @Column(name = "consentimiento_datos", nullable = false)
    private Boolean consentimientoDatos = true;

    @Column(name = "fecha_consentimiento", nullable = false)
    private java.time.LocalDateTime fechaConsentimiento = java.time.LocalDateTime.now();

    @Column(name = "consentimiento_version", nullable = false, length = 30)
    private String consentimientoVersion = "v1.0-ley29733";

    protected Postulante() {}

    public Postulante(Usuario usuario, String nombres, String apellidos) {
        this.usuario = usuario;
        this.nombres = nombres;
        this.apellidos = apellidos;
        this.consentimientoDatos = true;
        this.fechaConsentimiento = java.time.LocalDateTime.now();
        this.consentimientoVersion = "v1.0-ley29733";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }
    public String getNombres() { return nombres; }
    public void setNombres(String nombres) { this.nombres = nombres; }
    public String getApellidos() { return apellidos; }
    public void setApellidos(String apellidos) { this.apellidos = apellidos; }
    public String getEmail() { return usuario != null ? usuario.getEmail() : null; }
    public String getDni() { return dni; }
    public void setDni(String dni) { this.dni = dni; }
    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }
    public LocalDate getFechaNacimiento() { return fechaNacimiento; }
    public void setFechaNacimiento(LocalDate fechaNacimiento) { this.fechaNacimiento = fechaNacimiento; }
    public String getCvUrl() { return cvUrl; }
    public void setCvUrl(String cvUrl) { this.cvUrl = cvUrl; }
    public String getExperiencia() { return experiencia; }
    public void setExperiencia(String experiencia) { this.experiencia = experiencia; }
    public String getEducacion() { return educacion; }
    public void setEducacion(String educacion) { this.educacion = educacion; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public Boolean getConsentimientoDatos() { return consentimientoDatos; }
    public void setConsentimientoDatos(Boolean consentimientoDatos) { this.consentimientoDatos = consentimientoDatos; }
    public java.time.LocalDateTime getFechaConsentimiento() { return fechaConsentimiento; }
    public void setFechaConsentimiento(java.time.LocalDateTime fechaConsentimiento) { this.fechaConsentimiento = fechaConsentimiento; }
    public String getConsentimientoVersion() { return consentimientoVersion; }
    public void setConsentimientoVersion(String consentimientoVersion) { this.consentimientoVersion = consentimientoVersion; }
}
