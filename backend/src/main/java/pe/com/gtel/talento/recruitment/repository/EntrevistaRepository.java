package pe.com.gtel.talento.recruitment.repository;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import pe.com.gtel.talento.recruitment.entity.Entrevista;

@Repository
public interface EntrevistaRepository extends JpaRepository<Entrevista, Long> {

    List<Entrevista> findByOrderByFechaAscHoraAsc();

    List<Entrevista> findByPostulacionId(Long postulacionId);

    List<Entrevista> findByFecha(LocalDate fecha);

    @Query("SELECT e FROM Entrevista e WHERE e.postulacion.postulante.id = :postulanteId ORDER BY e.fecha DESC, e.hora DESC")
    List<Entrevista> findByPostulanteId(Long postulanteId);
}
