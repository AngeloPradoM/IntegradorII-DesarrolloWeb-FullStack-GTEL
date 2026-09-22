package pe.com.gtel.talento.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.com.gtel.talento.entity.Rol;

public interface RolRepository extends JpaRepository<Rol, Long> {
    Optional<Rol> findByNombre(String nombre);
}
