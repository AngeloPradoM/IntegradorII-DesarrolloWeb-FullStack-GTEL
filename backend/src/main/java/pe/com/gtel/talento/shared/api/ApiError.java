package pe.com.gtel.talento.shared.api;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.Map;

/** Existing error contract: detail and optional field errors, never exception contents. */
public record ApiError(String detail, @JsonInclude(JsonInclude.Include.NON_EMPTY) Map<String, String> errors) {
    public ApiError(String detail) {
        this(detail, Map.of());
    }
}
