package pe.com.gtel.talento.identity.dto;

public record AccountIdentity(long id,String email,String role,int version,boolean exempt,String status) {}
