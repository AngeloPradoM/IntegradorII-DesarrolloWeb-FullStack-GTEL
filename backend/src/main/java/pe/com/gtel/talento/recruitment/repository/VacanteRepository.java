package pe.com.gtel.talento.recruitment.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.com.gtel.talento.recruitment.entity.Vacante;

public interface VacanteRepository extends JpaRepository<Vacante, Long> {

    List<Vacante> findByEstadoOrderByFechaPublicacionDesc(String estado);

    List<Vacante> findAllByOrderByFechaPublicacionDesc();

    @Query("""
        SELECT v FROM Vacante v
        WHERE v.estado = 'activa'
          AND (:search IS NULL OR LOWER(v.titulo) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(v.descripcion) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(v.habilidades) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(v.departamento.nombre) LIKE LOWER(CONCAT('%', :search, '%')))
          AND (:type IS NULL OR v.tipoJornada = :type)
          AND (:modality IS NULL OR v.modalidad = :modality)
          AND (:location IS NULL OR LOWER(v.sede) LIKE LOWER(CONCAT('%', :location, '%')))
        ORDER BY v.fechaPublicacion DESC
    """)
    List<Vacante> searchPublicJobs(
        @Param("search") String search,
        @Param("type") String type,
        @Param("modality") String modality,
        @Param("location") String location
    );
}
