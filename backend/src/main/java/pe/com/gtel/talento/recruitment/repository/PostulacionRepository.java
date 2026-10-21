package pe.com.gtel.talento.recruitment.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.com.gtel.talento.recruitment.entity.Postulacion;

@Repository
public interface PostulacionRepository extends JpaRepository<Postulacion, Long> {

    @Query("SELECT p FROM Postulacion p JOIN FETCH p.vacante v LEFT JOIN FETCH v.departamento WHERE LOWER(p.postulante.usuario.email) = LOWER(:email) ORDER BY p.fechaPostulacion DESC")
    List<Postulacion> findByCandidateEmail(@Param("email") String email);

    @Query("SELECT p FROM Postulacion p JOIN FETCH p.vacante v LEFT JOIN FETCH v.departamento WHERE p.id = :id AND LOWER(p.postulante.usuario.email) = LOWER(:email)")
    Optional<Postulacion> findByIdAndCandidateEmail(@Param("id") Long id, @Param("email") String email);

    Optional<Postulacion> findByCodigo(String codigo);

    boolean existsByPostulanteIdAndVacanteId(Long postulanteId, Long vacanteId);

    boolean existsByCodigo(String codigo);

    long countByVacanteId(Long vacanteId);

    List<Postulacion> findByPostulanteIdOrderByFechaPostulacionDesc(Long postulanteId);

    Optional<Postulacion> findFirstByPostulanteIdOrderByFechaPostulacionDesc(Long postulanteId);
}
