package pe.com.gtel.talento.changemanagement.dto;

public record ChangeDocumentPayload(String name, String mimeType, byte[] content) {}
