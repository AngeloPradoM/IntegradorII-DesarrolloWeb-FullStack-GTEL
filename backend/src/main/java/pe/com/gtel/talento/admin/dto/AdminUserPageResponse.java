package pe.com.gtel.talento.admin.dto;

import java.util.List;

public record AdminUserPageResponse(List<AdminUserResponse> items, long total, int page) {
}
