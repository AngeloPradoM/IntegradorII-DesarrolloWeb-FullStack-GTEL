package pe.com.gtel.talento.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.com.gtel.talento.entity.Postulante;

public interface PostulanteRepository extends JpaRepository<Postulante, Long> {
    Optional<Postulante> findByUsuarioEmailIgnoreCase(String email);
}
