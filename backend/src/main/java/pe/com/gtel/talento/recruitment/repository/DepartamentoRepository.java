package pe.com.gtel.talento.recruitment.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.com.gtel.talento.recruitment.entity.Departamento;

public interface DepartamentoRepository extends JpaRepository<Departamento, Long> {
    List<Departamento> findByEstadoOrderByIdAsc(String estado);
    Optional<Departamento> findByNombreIgnoreCase(String nombre);
}
