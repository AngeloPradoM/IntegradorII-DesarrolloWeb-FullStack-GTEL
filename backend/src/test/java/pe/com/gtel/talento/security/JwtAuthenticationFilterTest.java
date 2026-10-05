package pe.com.gtel.talento.security;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import org.springframework.mock.web.*;
import org.springframework.security.core.context.SecurityContextHolder;
class JwtAuthenticationFilterTest {
    @Test void invalidTokenAndDatabaseFailureAreDifferent() throws Exception {
        var jwt=mock(JwtService.class);var accounts=mock(AccountAccessService.class);
        var filter=new JwtAuthenticationFilter(jwt,accounts);
        var request=new MockHttpServletRequest("GET","/api/auth/me");request.addHeader("Authorization","Bearer invalid");
        doThrow(new io.jsonwebtoken.MalformedJwtException("invalid")).when(accounts).validate("invalid",jwt);
        var chain=new MockFilterChain();filter.doFilter(request,new MockHttpServletResponse(),chain);
        assertNotNull(chain.getRequest());assertNull(SecurityContextHolder.getContext().getAuthentication());
        reset(accounts);doThrow(new org.springframework.dao.DataAccessResourceFailureException("private database details")).when(accounts).validate("invalid",jwt);
        var response=new MockHttpServletResponse();var failedChain=new MockFilterChain();
        filter.doFilter(request,response,failedChain);
        assertEquals(503,response.getStatus());assertNull(failedChain.getRequest());
        assertFalse(response.getContentAsString().contains("private"));
        SecurityContextHolder.clearContext();
    }
}
