package pe.com.gtel.talento.security;

import java.io.IOException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.lang.NonNull;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtService jwtService;
    private final AccountAccessService accounts;
    public JwtAuthenticationFilter(JwtService jwtService, AccountAccessService accounts) { this.jwtService = jwtService; this.accounts=accounts; }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            try {
                String token = header.substring(7).trim();
                accounts.validate(token,jwtService);
                String email = jwtService.getEmail(token);
                String role = jwtService.getRole(token);
                var authentication = new UsernamePasswordAuthenticationToken(
                        email, null, java.util.List.of(new SimpleGrantedAuthority("ROLE_" + role)));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (io.jsonwebtoken.JwtException | IllegalArgumentException ignored) {
                SecurityContextHolder.clearContext();
            } catch (org.springframework.web.server.ResponseStatusException ex) {
                SecurityContextHolder.clearContext();
                if(ex.getStatusCode().value()!=401)throw ex;
            } catch (org.springframework.dao.DataAccessException ex) {
                SecurityContextHolder.clearContext();
                response.setStatus(503);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"detail\":\"No se pudo comprobar la sesión. El servicio de datos no está disponible. Inténtalo nuevamente.\"}");
                return;
            }
        }
        chain.doFilter(request, response);
    }
}
