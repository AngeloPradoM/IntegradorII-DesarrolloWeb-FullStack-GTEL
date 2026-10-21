package pe.com.gtel.talento.recruitment.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.com.gtel.talento.recruitment.entity.PostulacionTimeline;

@Repository
public interface PostulacionTimelineRepository extends JpaRepository<PostulacionTimeline, Long> {

    @Query("SELECT t FROM PostulacionTimeline t LEFT JOIN FETCH t.usuario WHERE t.postulacion.id = :postulacionId ORDER BY t.fechaCambio ASC")
    List<PostulacionTimeline> findByPostulacionIdOrderByFechaCambioAsc(@Param("postulacionId") Long postulacionId);
}
