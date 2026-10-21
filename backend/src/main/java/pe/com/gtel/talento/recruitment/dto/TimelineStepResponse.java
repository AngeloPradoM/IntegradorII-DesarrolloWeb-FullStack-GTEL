package pe.com.gtel.talento.recruitment.dto;

public record TimelineStepResponse(
        String label,
        String date,
        boolean done,
        boolean active,
        boolean rejected,
        String comment
) {}
