package pe.com.gtel.talento.identity.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "postulantes")
public class Postulante {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne(optional = false)
    @JoinColumn(name = "usuario_id", nullable = false, unique = true)
    private Usuario usuario;
    @Column(nullable = false, length = 100) private String nombres;
    @Column(nullable = false, length = 100) private String apellidos;
    @Column(length = 16) private String telefono;

    protected Postulante() {}
    public Postulante(Usuario usuario, String nombres, String apellidos) {
        this.usuario = usuario;
        this.nombres = nombres;
        this.apellidos = apellidos;
    }
    public Long getId() { return id; }
    public String getNombres() { return nombres; }
    public String getApellidos() { return apellidos; }
    public String getEmail() { return usuario.getEmail(); }
    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }
}
