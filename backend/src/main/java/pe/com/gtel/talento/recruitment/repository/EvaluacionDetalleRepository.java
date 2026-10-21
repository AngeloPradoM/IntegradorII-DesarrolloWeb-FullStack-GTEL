package pe.com.gtel.talento.recruitment.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.com.gtel.talento.recruitment.entity.EvaluacionDetalle;

@Repository
public interface EvaluacionDetalleRepository extends JpaRepository<EvaluacionDetalle, Long> {

    List<EvaluacionDetalle> findByEvaluacionId(Long evaluacionId);
}
