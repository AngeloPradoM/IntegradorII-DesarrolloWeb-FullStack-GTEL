package pe.com.gtel.talento.otp;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OtpChallengeRepository extends JpaRepository<OtpChallenge, Long> {
    Optional<OtpChallenge> findTopByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<OtpChallenge> findBySessionId(String sessionId);
}
