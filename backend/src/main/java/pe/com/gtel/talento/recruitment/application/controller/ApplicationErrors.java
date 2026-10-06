package pe.com.gtel.talento.recruitment.application.controller;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pe.com.gtel.talento.shared.api.ApiError;
@Order(-1)
@RestControllerAdvice(assignableTypes=ApplicationController.class)
public class ApplicationErrors {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> invalid(MethodArgumentNotValidException e){
        var messages=Map.of("nombres","Revisa tus nombres (máximo 100 caracteres).","apellidos","Revisa tus apellidos (máximo 100 caracteres).","dni","Ingresa un DNI de 8 dígitos.","telefono","Ingresa un teléfono válido con prefijo, por ejemplo +51987654321.","distrito","Selecciona tu distrito (máximo 100 caracteres).","motivacion","La motivación admite hasta 3000 caracteres.","status","Selecciona un estado válido.");
        var errors=new LinkedHashMap<String,String>();
        e.getBindingResult().getFieldErrors().forEach(f->errors.put(f.getField(),messages.getOrDefault(f.getField(),"Revisa este campo.")));
        return ResponseEntity.badRequest().body(new ApiError(String.join(" ",errors.values()),errors));
    }
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> unreadable(){return ResponseEntity.badRequest().body(new ApiError("No se pudieron leer los datos de la postulación. Recarga la página y vuelve a completar el formulario."));}
}
