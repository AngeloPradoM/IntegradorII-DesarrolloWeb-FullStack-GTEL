package pe.com.gtel.talento.shared.api;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** Fallback for persistence errors. Module-specific validation handlers take precedence. */
@Order(Ordered.LOWEST_PRECEDENCE)
@RestControllerAdvice(basePackages = "pe.com.gtel.talento")
public class ApiExceptionHandler {
    private static final org.slf4j.Logger log=org.slf4j.LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> invalidArguments(MethodArgumentNotValidException exception) {
        Map<String,String> errors=new LinkedHashMap<>();
        exception.getBindingResult().getFieldErrors().forEach(error ->
            errors.putIfAbsent(error.getField(), error.getDefaultMessage()));
        String field=errors.keySet().stream().findFirst().orElse("solicitud");
        return ResponseEntity.badRequest().body(new ApiError(
            "Revisa el campo '" + field + "' y vuelve a intentarlo.", errors));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> unreadableRequest(HttpMessageNotReadableException exception) {
        return ResponseEntity.badRequest().body(new ApiError(
            "El formato enviado no es válido. Revisa especialmente las fechas y opciones seleccionadas."));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> conflict(DataIntegrityViolationException exception) {
        return ResponseEntity.status(409)
            .body(new ApiError("No se pudo completar la operación: los datos entran en conflicto con un registro existente."));
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<ApiError> unavailable(DataAccessException exception) {
        String reference=java.util.UUID.randomUUID().toString();
        log.error("Persistence failure reference={} type={}",
            reference,exception.getClass().getSimpleName(),exception);
        boolean unavailable=exception instanceof org.springframework.dao.DataAccessResourceFailureException;
        return ResponseEntity.status(unavailable?503:500).header("X-Error-Id",reference)
            .body(new ApiError(unavailable?"El servicio de datos no está disponible. Inténtalo nuevamente.":"Ocurrió un error interno. Comunica al administrador la referencia de esta solicitud."));
    }
}
