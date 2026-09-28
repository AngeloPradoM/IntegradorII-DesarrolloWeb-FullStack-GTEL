package pe.com.gtel.talento.otp;

public enum OtpSessionStatus {
    LOGIN_REQUIRED,
    OTP_PENDING,
    AUTHENTICATED,
    OTP_EXPIRED,
    OTP_LOCKED
}
