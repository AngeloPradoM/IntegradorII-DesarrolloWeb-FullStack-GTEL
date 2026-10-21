package pe.com.gtel.talento.security.ratelimit;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class RateLimitingFilter extends OncePerRequestFilter {

    private final RateLimitingService rateLimitingService;

    public RateLimitingFilter(RateLimitingService rateLimitingService) {
        this.rateLimitingService = rateLimitingService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        String method = request.getMethod();

        String operation = resolveOperation(path, method);

        // Si la ruta no está bajo control de rate limit estricto, continuar
        if (operation == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = extractClientIp(request);
        RateLimitingService.RateLimitResult result = rateLimitingService.check(clientIp, operation);

        if (!result.allowed()) {
            response.setStatus(429); // 429 Too Many Requests
            response.setHeader("Retry-After", String.valueOf(result.retryAfterSeconds()));
            response.setHeader("X-RateLimit-Limit", String.valueOf(result.limit()));
            response.setHeader("X-RateLimit-Remaining", "0");
            response.setContentType("application/json;charset=UTF-8");

            String json = String.format(
                    "{\"error\":\"TOO_MANY_REQUESTS\",\"message\":\"Demasiadas solicitudes. Por favor, espere %d segundos antes de reintentar.\",\"retryAfter\":%d,\"limit\":%d}",
                    result.retryAfterSeconds(),
                    result.retryAfterSeconds(),
                    result.limit()
            );
            response.getWriter().write(json);
            return;
        }

        response.setHeader("X-RateLimit-Limit", String.valueOf(result.limit()));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(result.remaining()));

        filterChain.doFilter(request, response);
    }

    private String resolveOperation(String path, String method) {
        if ("OPTIONS".equalsIgnoreCase(method)) {
            return null;
        }

        if (path.startsWith("/api/auth/login")) {
            return "LOGIN";
        }
        if (path.startsWith("/api/auth/otp") || path.startsWith("/api/auth/resend-otp") || path.startsWith("/api/auth/verify-otp")) {
            return "OTP";
        }
        if (path.startsWith("/api/auth/register")) {
            return "REGISTER";
        }
        if (path.startsWith("/api/candidate/applications") && "POST".equalsIgnoreCase(method)) {
            return "APPLICATION";
        }

        return null;
    }

    private String extractClientIp(HttpServletRequest request) {
        String xForwarded = request.getHeader("X-Forwarded-For");
        if (xForwarded != null && !xForwarded.isBlank()) {
            return xForwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
    }
}
