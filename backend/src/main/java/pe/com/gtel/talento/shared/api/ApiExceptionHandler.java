package pe.com.gtel.talento.shared.api;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** Fallback for persistence errors. Module-specific validation handlers take precedence. */
@Order(Ordered.LOWEST_PRECEDENCE)
@RestControllerAdvice(basePackages = "pe.com.gtel.talento")
public class ApiExceptionHandler {
    private static final org.slf4j.Logger log=org.slf4j.LoggerFactory.getLogger(ApiExceptionHandler.class);
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> conflict(DataIntegrityViolationException exception) {
        return ResponseEntity.status(409)
            .body(new ApiError("No se pudo completar la operación: los datos entran en conflicto con un registro existente."));
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<ApiError> unavailable(DataAccessException exception) {
        String reference=java.util.UUID.randomUUID().toString();
        log.error("Persistence failure reference={} type={}",reference,exception.getClass().getSimpleName());
        boolean unavailable=exception instanceof org.springframework.dao.DataAccessResourceFailureException;
        return ResponseEntity.status(unavailable?503:500).header("X-Error-Id",reference)
            .body(new ApiError(unavailable?"El servicio de datos no está disponible. Inténtalo nuevamente.":"Ocurrió un error interno. Comunica al administrador la referencia de esta solicitud."));
    }
}
