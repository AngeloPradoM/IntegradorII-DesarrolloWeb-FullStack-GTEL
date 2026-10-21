package pe.com.gtel.talento.recruitment.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.com.gtel.talento.recruitment.entity.RequerimientoPersonal;

@Repository
public interface RequerimientoPersonalRepository extends JpaRepository<RequerimientoPersonal, Long> {

    List<RequerimientoPersonal> findAllByOrderByFechaSolicitudDesc();

    List<RequerimientoPersonal> findBySolicitanteEmailIgnoreCaseOrderByFechaSolicitudDesc(String email);

    List<RequerimientoPersonal> findByDepartamentoIdOrderByFechaSolicitudDesc(Long departamentoId);

    List<RequerimientoPersonal> findByEstadoOrderByFechaSolicitudDesc(String estado);
}
