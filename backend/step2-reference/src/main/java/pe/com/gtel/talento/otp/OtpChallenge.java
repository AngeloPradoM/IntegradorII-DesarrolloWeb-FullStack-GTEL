package pe.com.gtel.talento.otp;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "otp_challenges")
public class OtpChallenge {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", nullable = false, length = 128)
    private String sessionId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "phone_number_hash", nullable = false, length = 255)
    private String phoneNumberHash;

    @Column(name = "otp_hash", nullable = false, length = 255)
    private String otpHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private OtpSessionStatus status = OtpSessionStatus.OTP_PENDING;

    @Column(nullable = false)
    private int attempts = 0;

    @Column(name = "max_attempts", nullable = false)
    private int maxAttempts;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "consumed_at")
    private Instant consumedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "last_sent_at")
    private Instant lastSentAt;

    protected OtpChallenge() {
    }

    public OtpChallenge(String sessionId, Long userId, String phoneNumberHash, String otpHash,
                        int maxAttempts, Instant expiresAt, Instant createdAt, Instant lastSentAt) {
        this.sessionId = sessionId;
        this.userId = userId;
        this.phoneNumberHash = phoneNumberHash;
        this.otpHash = otpHash;
        this.maxAttempts = maxAttempts;
        this.expiresAt = expiresAt;
        this.createdAt = createdAt;
        this.lastSentAt = lastSentAt;
    }

    public Long getId() { return id; }
    public String getSessionId() { return sessionId; }
    public Long getUserId() { return userId; }
    public String getPhoneNumberHash() { return phoneNumberHash; }
    public String getOtpHash() { return otpHash; }
    public OtpSessionStatus getStatus() { return status; }
    public int getAttempts() { return attempts; }
    public int getMaxAttempts() { return maxAttempts; }
    public Instant getExpiresAt() { return expiresAt; }
    public Instant getConsumedAt() { return consumedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getLastSentAt() { return lastSentAt; }

    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public void setStatus(OtpSessionStatus status) { this.status = status; }
    public void setAttempts(int attempts) { this.attempts = attempts; }
    public void setOtpHash(String otpHash) { this.otpHash = otpHash; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
    public void setConsumedAt(Instant consumedAt) { this.consumedAt = consumedAt; }
    public void setLastSentAt(Instant lastSentAt) { this.lastSentAt = lastSentAt; }
}
