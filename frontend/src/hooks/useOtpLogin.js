import { useEffect, useRef, useState } from "react";
import { loginCandidate, verifyOtp, resendOtp } from "../services/api";

export default function useOtpLogin(onAuthenticated) {
  const [session, setSession] = useState(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const busy = useRef(false);
  useEffect(() => {
    if (!session) return;
    const tick = () => setResendCooldown(Math.max(0, Math.ceil((session.resendAt - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [session]);
  const acceptSession = (data) => {
    if (!data.requiresOtp || !data.sessionId) throw new Error("Respuesta de autenticación inválida");
    setSession({ ...data, resendAt: Date.now() + data.resendAfterSeconds * 1000 });
    setResendCooldown(data.resendAfterSeconds);
    setVerificationCode("");
  };
  const run = async (action) => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setError("");
    try { await action(); } catch (e) { setError(e.message || "No se pudo conectar con el servidor"); }
    finally { busy.current = false; setLoading(false); }
  };
  return {
    session, verificationStep: Boolean(session), verificationCode, setVerificationCode,
    error, setError, loading, resendCooldown,
    start: (credentials) => run(async () => acceptSession(await loginCandidate(credentials))),
    resend: () => run(async () => {
      if (resendCooldown > 0 || !session) return;
      acceptSession(await resendOtp(session.sessionId));
    }),
    verify: () => run(async () => {
      if (!session || !/^[0-9]{6}$/.test(verificationCode)) throw new Error("Introduce los 6 dígitos del código");
      const result = await verifyOtp(session.sessionId, verificationCode);
      if (!result.verified || !result.token) throw new Error("No se pudo completar la verificación");
      onAuthenticated({ ...result, rol: result.role });
      setSession(null);
      setVerificationCode("");
    }),
    reset: () => { setSession(null); setVerificationCode(""); setError(""); },
  };
}
