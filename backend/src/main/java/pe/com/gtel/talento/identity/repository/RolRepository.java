package pe.com.gtel.talento.identity.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.com.gtel.talento.identity.entity.Rol;

public interface RolRepository extends JpaRepository<Rol, Long> {
    Optional<Rol> findByNombre(String nombre);
}
