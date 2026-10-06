package pe.com.gtel.talento.admin.controller;

import org.springframework.core.annotation.Order;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pe.com.gtel.talento.shared.api.ApiError;

@RestControllerAdvice(assignableTypes=AdminUserController.class)
@Order(-1)
public class AdminErrors {
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> conflict(DataIntegrityViolationException exception){
        return ResponseEntity.status(409).body(new ApiError("No se pudo guardar: correo duplicado o datos relacionados incompatibles."));
    }
}
