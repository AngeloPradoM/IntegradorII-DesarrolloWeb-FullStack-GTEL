package pe.com.gtel.talento.identity.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.com.gtel.talento.identity.entity.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    boolean existsByEmailIgnoreCase(String email);
    Optional<Usuario> findByEmailIgnoreCase(String email);

    @Query("SELECT u FROM Usuario u JOIN u.rol r WHERE r.nombre IN :roles AND u.estado = 'activo'")
    List<Usuario> findActiveByRoleNames(@Param("roles") Collection<String> roles);
}
