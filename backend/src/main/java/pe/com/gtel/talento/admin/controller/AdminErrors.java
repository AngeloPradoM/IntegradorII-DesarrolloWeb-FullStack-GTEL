package pe.com.gtel.talento.admin.controller;

import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice(assignableTypes=AdminUserController.class)
public class AdminErrors {
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String,String>> conflict(DataIntegrityViolationException exception){
        return ResponseEntity.status(409).body(Map.of("detail","No se pudo guardar: correo duplicado o datos relacionados incompatibles."));
    }
}
