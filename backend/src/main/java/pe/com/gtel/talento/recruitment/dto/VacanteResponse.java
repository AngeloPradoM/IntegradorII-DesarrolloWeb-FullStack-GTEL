package pe.com.gtel.talento.recruitment.dto;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import pe.com.gtel.talento.recruitment.entity.Vacante;

public class VacanteResponse {

    private String id;
    private String title;
    private String titulo;
    private String description;
    private String descripcion;
    private String department;
    private String departamento;
    private Long departmentId;
    private String location;
    private String sede;
    private String type;
    private String tipoJornada;
    private String modality;
    private String modalidad;
    private String salary;
    private BigDecimal salaryMin;
    private BigDecimal sueldoMin;
    private BigDecimal salaryMax;
    private BigDecimal sueldoMax;
    private Integer vacancies;
    private Integer numVacantes;
    private String status;
    private String estado;
    private String date;
    private String fechaPublicacion;
    private String deadline;
    private String fechaLimitePostulacion;
    private String education;
    private String nivelEducativo;
    private String experience;
    private String experienciaMinima;
    private List<String> tags;
    private String habilidades;
    private String posted;
    private Integer applicantsCount = 0;

    public static VacanteResponse fromEntity(Vacante entity, int applicantsCount) {
        VacanteResponse dto = new VacanteResponse();
        dto.id = String.valueOf(entity.getId());
        dto.title = entity.getTitulo();
        dto.titulo = entity.getTitulo();
        dto.description = entity.getDescripcion() != null ? entity.getDescripcion() : "";
        dto.descripcion = dto.description;

        if (entity.getDepartamento() != null) {
            dto.department = entity.getDepartamento().getNombre();
            dto.departamento = entity.getDepartamento().getNombre();
            dto.departmentId = entity.getDepartamento().getId();
        } else {
            dto.department = "General";
            dto.departamento = "General";
        }

        dto.location = entity.getSede() != null ? entity.getSede() : "Lima, Perú";
        dto.sede = dto.location;

        dto.tipoJornada = entity.getTipoJornada();
        dto.type = formatTipoJornada(entity.getTipoJornada());

        dto.modalidad = entity.getModalidad();
        dto.modality = formatModalidad(entity.getModalidad());

        dto.salaryMin = entity.getSueldoMin();
        dto.sueldoMin = entity.getSueldoMin();
        dto.salaryMax = entity.getSueldoMax();
        dto.sueldoMax = entity.getSueldoMax();
        dto.salary = formatSalary(entity.getSueldoMin(), entity.getSueldoMax());

        dto.vacancies = entity.getNumVacantes() != null ? entity.getNumVacantes() : 1;
        dto.numVacantes = dto.vacancies;

        dto.status = entity.getEstado() != null ? entity.getEstado() : "activa";
        dto.estado = dto.status;

        if (entity.getFechaPublicacion() != null) {
            dto.date = entity.getFechaPublicacion().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
            dto.fechaPublicacion = entity.getFechaPublicacion().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            dto.posted = entity.getFechaPublicacion().format(DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.forLanguageTag("es-PE")));
        } else {
            dto.date = LocalDate.now().toString();
            dto.fechaPublicacion = LocalDate.now().toString();
            dto.posted = "Disponible";
        }

        if (entity.getFechaLimitePostulacion() != null) {
            dto.deadline = entity.getFechaLimitePostulacion().toString();
            dto.fechaLimitePostulacion = entity.getFechaLimitePostulacion().toString();
        }

        dto.education = entity.getNivelEducativo() != null ? entity.getNivelEducativo() : "";
        dto.nivelEducativo = dto.education;

        dto.experience = entity.getExperienciaMinima() != null ? entity.getExperienciaMinima() : "";
        dto.experienciaMinima = dto.experience;

        dto.habilidades = entity.getHabilidades() != null ? entity.getHabilidades() : "";
        if (entity.getHabilidades() != null && !entity.getHabilidades().isBlank()) {
            dto.tags = Arrays.stream(entity.getHabilidades().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
        } else {
            dto.tags = List.of();
        }

        dto.applicantsCount = applicantsCount;
        return dto;
    }

    private static String formatTipoJornada(String raw) {
        if (raw == null) return "Full-Time";
        return switch (raw.toLowerCase()) {
            case "full_time", "full-time" -> "Full-Time";
            case "part_time", "part-time" -> "Part-Time";
            case "por_turnos", "por turnos" -> "Por turnos";
            case "freelance" -> "Freelance";
            default -> raw;
        };
    }

    private static String formatModalidad(String raw) {
        if (raw == null) return "Presencial";
        return switch (raw.toLowerCase()) {
            case "presencial" -> "Presencial";
            case "remoto" -> "Remoto";
            case "hibrido", "híbrido" -> "Híbrido";
            default -> raw;
        };
    }

    private static String formatSalary(BigDecimal min, BigDecimal max) {
        DecimalFormatSymbols symbols = new DecimalFormatSymbols(Locale.US);
        symbols.setGroupingSeparator(',');
        DecimalFormat df = new DecimalFormat("#,##0", symbols);

        if (min != null && max != null) {
            return "S/ " + df.format(min) + " - S/ " + df.format(max);
        } else if (min != null) {
            return "Desde S/ " + df.format(min);
        } else if (max != null) {
            return "Hasta S/ " + df.format(max);
        }
        return "A convenir";
    }

    public String getId() { return id; }
    public String getTitle() { return title; }
    public String getTitulo() { return titulo; }
    public String getDescription() { return description; }
    public String getDescripcion() { return descripcion; }
    public String getDepartment() { return department; }
    public String getDepartamento() { return departamento; }
    public Long getDepartmentId() { return departmentId; }
    public String getLocation() { return location; }
    public String getSede() { return sede; }
    public String getType() { return type; }
    public String getTipoJornada() { return tipoJornada; }
    public String getModality() { return modality; }
    public String getModalidad() { return modalidad; }
    public String getSalary() { return salary; }
    public BigDecimal getSalaryMin() { return salaryMin; }
    public BigDecimal getSueldoMin() { return sueldoMin; }
    public BigDecimal getSalaryMax() { return salaryMax; }
    public BigDecimal getSueldoMax() { return sueldoMax; }
    public Integer getVacancies() { return vacancies; }
    public Integer getNumVacantes() { return numVacantes; }
    public String getStatus() { return status; }
    public String getEstado() { return estado; }
    public String getDate() { return date; }
    public String getFechaPublicacion() { return fechaPublicacion; }
    public String getDeadline() { return deadline; }
    public String getFechaLimitePostulacion() { return fechaLimitePostulacion; }
    public String getEducation() { return education; }
    public String getNivelEducativo() { return nivelEducativo; }
    public String getExperience() { return experience; }
    public String getExperienciaMinima() { return experienciaMinima; }
    public List<String> getTags() { return tags; }
    public String getHabilidades() { return habilidades; }
    public String getPosted() { return posted; }
    public Integer getApplicantsCount() { return applicantsCount; }
}
