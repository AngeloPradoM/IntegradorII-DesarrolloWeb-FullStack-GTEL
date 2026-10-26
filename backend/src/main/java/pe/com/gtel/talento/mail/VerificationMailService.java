package pe.com.gtel.talento.mail;

import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class VerificationMailService {
    private static final Logger log = LoggerFactory.getLogger(VerificationMailService.class);
    private final JavaMailSender sender;
    private final String from;

    public VerificationMailService(JavaMailSender sender, @Value("${spring.mail.username:}") String from) {
        this.sender = sender;
        this.from = from;
    }

    public void send(String recipient, String code) {
        if (from == null || from.isBlank()) {
            throw new IllegalStateException("Remitente no configurado");
        }
        try {
            MimeMessage mimeMessage = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(new InternetAddress(from, "GTEL Talento ATS"));
            helper.setTo(recipient);
            helper.setSubject("Código de verificación: " + code + " - GTEL Talento");

            String plainText = "Tu código para iniciar sesión es: " + code
                    + "\n\nVence en 5 minutos. No lo compartas. Si no solicitaste este acceso, ignora este mensaje.";

            String htmlText = buildHtmlTemplate(code);

            helper.setText(plainText, htmlText);
            sender.send(mimeMessage);
            log.info("OTP verification email sent successfully to {}", recipient);
        } catch (Exception e) {
            log.error("Error sending OTP email: {}", e.getMessage());
            throw new RuntimeException("Error al enviar correo de verificación", e);
        }
    }

    private String buildHtmlTemplate(String code) {
        return """
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Código de Verificación - GTEL Talento</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F1F5F9; padding: 40px 20px;">
                <tr>
                  <td align="center">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.04); border: 1px solid #E2E8F0;">
                      <!-- Cabecera Ejecutiva -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); padding: 36px 32px; text-align: center;">
                          <table width="100%" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                              <td align="center">
                                <div style="display: inline-block; background-color: rgba(220,38,38,0.15); border: 1px solid rgba(220,38,38,0.3); border-radius: 8px; padding: 6px 14px; margin-bottom: 12px;">
                                  <span style="color: #F87171; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">Portal Oficial de Atracción</span>
                                </div>
                                <h1 style="margin: 0; color: #FFFFFF; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                                  GTEL <span style="color: #EF4444;">TALENTO</span>
                                </h1>
                                <p style="margin: 6px 0 0 0; color: #94A3B8; font-size: 13px; font-weight: 500;">
                                  Sistema Integral de Selección y Gestión de Talento
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <!-- Contenido Principal -->
                      <tr>
                        <td style="padding: 36px 32px;">
                          <h2 style="margin: 0 0 12px 0; color: #0F172A; font-size: 19px; font-weight: 700; letter-spacing: -0.3px;">
                            Verificación de Seguridad
                          </h2>
                          <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                            Has solicitado iniciar sesión o registrar tu postulación en la plataforma de <strong>GTEL Talento</strong>. Para continuar con tu acceso seguro, ingresa el siguiente código de verificación:
                          </p>
                          
                          <!-- Caja de Código OTP -->
                          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                            <tr>
                              <td align="center" style="background-color: #F8FAFC; border: 2px dashed #CBD5E1; border-radius: 12px; padding: 24px 16px;">
                                <span style="display: block; color: #64748B; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px;">Tu Código de Acceso</span>
                                <span style="display: inline-block; font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 38px; font-weight: 800; color: #DC2626; letter-spacing: 10px; padding-left: 10px;">
                                  """ + code + """
                                </span>
                              </td>
                            </tr>
                          </table>

                          <!-- Aviso de Vigencia -->
                          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FEF2F2; border-left: 4px solid #EF4444; border-radius: 4px; padding: 12px 16px; margin-bottom: 24px;">
                            <tr>
                              <td>
                                <p style="margin: 0; color: #991B1B; font-size: 13px; font-weight: 500; line-height: 1.5;">
                                  ⏱️ <strong>Vigencia:</strong> Este código expira en <strong>5 minutos</strong> por motivos de seguridad.
                                </p>
                              </td>
                            </tr>
                          </table>

                          <p style="margin: 0; color: #64748B; font-size: 13px; line-height: 1.6;">
                            🔒 <strong>Aviso de Confidencialidad:</strong> El equipo de GTEL nunca te solicitará este código por llamada, WhatsApp ni redes sociales. No compartas esta clave con terceros.
                          </p>
                        </td>
                      </tr>
                      <!-- Pie de Página Institucional -->
                      <tr>
                        <td style="background-color: #F8FAFC; padding: 24px 32px; border-top: 1px solid #E2E8F0; text-align: center;">
                          <p style="margin: 0 0 8px 0; color: #64748B; font-size: 12px; line-height: 1.5;">
                            Si tú no solicitaste este código, puedes desestimar este mensaje de forma segura. Tu cuenta no ha sido comprometida.
                          </p>
                          <p style="margin: 0; color: #94A3B8; font-size: 11px;">
                            © 2026 GTEL Comunicaciones — Todos los derechos reservados.<br>
                            Plataforma ATS desarrollada para el Curso Integrador II · UTP
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """;
    }
}
