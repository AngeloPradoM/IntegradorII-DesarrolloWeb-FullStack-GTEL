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
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> conflict(DataIntegrityViolationException exception) {
        return ResponseEntity.status(409)
            .body(new ApiError("No se pudo completar la operación: los datos entran en conflicto con un registro existente."));
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<ApiError> unavailable(DataAccessException exception) {
        return ResponseEntity.status(503)
            .body(new ApiError("El servicio de datos no está disponible. Inténtalo nuevamente."));
    }
}
