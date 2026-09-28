import { useEffect, useRef, useState } from "react";
import { loginCandidate, verifyOtp, resendOtp } from "../services/api";

export default function useOtpLogin(onAuthenticated) {
  const [session, setSession] = useState(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const busy = useRef(false);
  const generation = useRef(0);
  useEffect(() => () => { generation.current += 1; }, []);
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
    const current = generation.current;
    const isCurrent = () => current === generation.current;
    try { await action(isCurrent); } catch (e) { if (isCurrent()) setError(e.message || "No se pudo conectar con el servidor"); }
    finally { if (isCurrent()) { busy.current = false; setLoading(false); } }
  };
  return {
    session, verificationStep: Boolean(session), verificationCode, setVerificationCode,
    error, setError, loading, resendCooldown,
    start: (credentials) => run(async isCurrent => { const data = await loginCandidate(credentials); if (isCurrent()) onAuthenticated(data); }),
    resend: () => run(async isCurrent => {
      if (resendCooldown > 0 || !session) return;
      const data = await resendOtp(session.sessionId);
      if (isCurrent()) acceptSession(data);
    }),
    verify: () => run(async isCurrent => {
      if (!session || !/^[0-9]{6}$/.test(verificationCode)) throw new Error("Introduce los 6 dígitos del código");
      const result = await verifyOtp(session.sessionId, verificationCode);
      if (!isCurrent()) return;
      if (!result.verified || !result.token) throw new Error("No se pudo completar la verificación");
      onAuthenticated({ ...result, rol: result.role });
      setSession(null);
      setVerificationCode("");
    }),
    reset: () => { generation.current += 1; busy.current = false; setLoading(false); setSession(null); setVerificationCode(""); setError(""); setResendCooldown(0); },
  };
}
