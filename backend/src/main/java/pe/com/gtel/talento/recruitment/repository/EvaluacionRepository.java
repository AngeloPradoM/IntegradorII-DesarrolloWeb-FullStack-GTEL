package pe.com.gtel.talento.recruitment.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import pe.com.gtel.talento.recruitment.entity.Evaluacion;

@Repository
public interface EvaluacionRepository extends JpaRepository<Evaluacion, Long> {

    List<Evaluacion> findByOrderByFechaEvaluacionDescIdDesc();

    List<Evaluacion> findByPostulacionId(Long postulacionId);

    @Query("SELECT e FROM Evaluacion e WHERE e.postulacion.postulante.id = :postulanteId ORDER BY e.fechaEvaluacion DESC")
    List<Evaluacion> findByPostulanteId(Long postulanteId);
}
