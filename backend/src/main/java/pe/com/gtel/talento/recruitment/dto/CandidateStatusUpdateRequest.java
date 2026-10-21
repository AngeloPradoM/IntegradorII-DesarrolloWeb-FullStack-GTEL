package pe.com.gtel.talento.recruitment.dto;

public class CandidateStatusUpdateRequest {
    private String status;
    private String comment;

    public CandidateStatusUpdateRequest() {}

    public CandidateStatusUpdateRequest(String status, String comment) {
        this.status = status;
        this.comment = comment;
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
}
