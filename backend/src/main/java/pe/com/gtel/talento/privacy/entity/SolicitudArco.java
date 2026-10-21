package pe.com.gtel.talento.privacy.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import pe.com.gtel.talento.identity.entity.Usuario;

@Entity
@Table(name = "solicitudes_arco")
public class SolicitudArco {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(name = "email_solicitante", nullable = false, length = 150)
    private String emailSolicitante;

    @Column(name = "tipo_solicitud", nullable = false, length = 30)
    private String tipoSolicitud; // ACCESO, RECTIFICACION, CANCELACION_OLVIDO, OPOSICION

    @Column(nullable = false, length = 20)
    private String estado = "EJECUTADA";

    @Column(columnDefinition = "TEXT")
    private String detalle;

    @Column(name = "ip_origen", length = 45)
    private String ipOrigen;

    @Column(name = "user_agent", length = 255)
    private String userAgent;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    protected SolicitudArco() {}

    public SolicitudArco(Usuario usuario, String emailSolicitante, String tipoSolicitud, String detalle, String ipOrigen, String userAgent) {
        this.usuario = usuario;
        this.emailSolicitante = emailSolicitante;
        this.tipoSolicitud = tipoSolicitud;
        this.detalle = detalle;
        this.ipOrigen = ipOrigen;
        this.userAgent = userAgent;
        this.estado = "EJECUTADA";
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }
    public String getEmailSolicitante() { return emailSolicitante; }
    public String getTipoSolicitud() { return tipoSolicitud; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public String getDetalle() { return detalle; }
    public String getIpOrigen() { return ipOrigen; }
    public String getUserAgent() { return userAgent; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
