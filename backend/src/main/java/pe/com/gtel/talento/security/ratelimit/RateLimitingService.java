package pe.com.gtel.talento.security.ratelimit;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class RateLimitingService {

    public record RateLimitResult(
            boolean allowed,
            int limit,
            int remaining,
            long retryAfterSeconds
    ) {}

    public record Policy(
            int maxRequests,
            long windowSeconds
    ) {}

    private final Map<String, Policy> policies = Map.of(
            "LOGIN", new Policy(10, 60),       // 10 intentos por minuto
            "OTP", new Policy(5, 60),          // 5 envíos/verificaciones por minuto
            "REGISTER", new Policy(5, 60),     // 5 registros por minuto
            "APPLICATION", new Policy(15, 3600), // 15 postulaciones por hora
            "GENERAL", new Policy(120, 60)     // 120 peticiones generales por minuto
    );

    private final ConcurrentHashMap<String, RequestBucket> buckets = new ConcurrentHashMap<>();

    public RateLimitResult check(String clientKey, String operation) {
        Policy policy = policies.getOrDefault(operation, policies.get("GENERAL"));
        String bucketKey = operation + ":" + clientKey;

        long now = Instant.now().getEpochSecond();
        RequestBucket bucket = buckets.compute(bucketKey, (k, existing) -> {
            if (existing == null || existing.isExpired(now, policy.windowSeconds())) {
                return new RequestBucket(now, 1);
            } else {
                existing.increment();
                return existing;
            }
        });

        int currentCount = bucket.getCount();
        if (currentCount > policy.maxRequests()) {
            long retryAfter = Math.max(1, (bucket.getCreatedSeconds() + policy.windowSeconds()) - now);
            return new RateLimitResult(false, policy.maxRequests(), 0, retryAfter);
        }

        int remaining = policy.maxRequests() - currentCount;
        return new RateLimitResult(true, policy.maxRequests(), remaining, 0);
    }

    public void reset(String clientKey, String operation) {
        String bucketKey = operation + ":" + clientKey;
        buckets.remove(bucketKey);
    }

    public void clearAll() {
        buckets.clear();
    }

    public static class RequestBucket {
        private final long createdSeconds;
        private int count;

        public RequestBucket(long createdSeconds, int initialCount) {
            this.createdSeconds = createdSeconds;
            this.count = initialCount;
        }

        public synchronized void increment() {
            this.count++;
        }

        public synchronized int getCount() {
            return count;
        }

        public long getCreatedSeconds() {
            return createdSeconds;
        }

        public boolean isExpired(long nowSeconds, long windowSeconds) {
            return (nowSeconds - createdSeconds) >= windowSeconds;
        }
    }
}
