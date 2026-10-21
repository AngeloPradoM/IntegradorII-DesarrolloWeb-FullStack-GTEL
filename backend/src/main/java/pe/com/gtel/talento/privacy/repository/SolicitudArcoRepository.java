package pe.com.gtel.talento.privacy.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.com.gtel.talento.privacy.entity.SolicitudArco;

public interface SolicitudArcoRepository extends JpaRepository<SolicitudArco, Long> {
    List<SolicitudArco> findByEmailSolicitanteIgnoreCaseOrderByCreatedAtDesc(String email);
    List<SolicitudArco> findByUsuarioIdOrderByCreatedAtDesc(Long usuarioId);
}
