import { useEffect, useRef, useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, MessageSquareText, Briefcase, User } from "lucide-react";

import useOtpLogin from "../../hooks/useOtpLogin";
import useModalFocus from "../../hooks/useModalFocus";
import AuthCardHeader from "./AuthCardHeader";
import AuthCardFooter from "./AuthCardFooter";
import OtpInput from "./OtpInput";
import { IS_DEMO_MODE } from "../../services/api";

export default function AuthModal({ isOpen, onClose, onSubmit, onRegisterClick, defaultRole = "CANDIDATO", notice = "" }) {
  const [form, setForm] = useState({ email: "", password: "", rol: defaultRole });
  const [showPassword, setShowPassword] = useState(false);
  const otp = useOtpLogin((user) => { if (onSubmit) onSubmit(user); else onClose?.(); });
  const { session, verificationStep, verificationCode, setVerificationCode, error, loading: isSubmitting, resendCooldown } = otp;
  const [isDragging, setIsDragging] = useState(false);
  const modalRef = useRef(null);
  useModalFocus(modalRef, isOpen, onClose);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!isOpen) return;

    const width = modalRef.current?.offsetWidth || 460;
    const height = modalRef.current?.offsetHeight || 560;
    const x = Math.max(20, (window.innerWidth - width) / 2);
    const y = Math.max(16, (window.innerHeight - height) / 2);
    setPosition({ x, y });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isDragging) return;

    const onMove = (event) => {
      const nextX = event.clientX - dragOffset.current.x;
      const nextY = event.clientY - dragOffset.current.y;
      const width = modalRef.current?.offsetWidth || 460;
      const height = modalRef.current?.offsetHeight || 560;

      setPosition({
        x: Math.min(Math.max(16, nextX), Math.max(16, window.innerWidth - width - 16)),
        y: Math.min(Math.max(16, nextY), Math.max(16, window.innerHeight - height - 16)),
      });
    };

    const onUp = () => setIsDragging(false);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [isDragging, isOpen]);

  const resetState = otp.reset;
  const handleSubmit = (event) => {
    event.preventDefault();
    otp.start({ email: form.email.trim(), password: form.password, rol: form.rol });
  };
  const handleResendOtp = otp.resend;
  const handleVerificationSubmit = (event) => { event.preventDefault(); otp.verify(); };

  const handleDragStart = (event) => {
    if (event.target.closest("input") || event.target.closest("button") || event.target.closest("select")) {
      return;
    }
    setIsDragging(true);
    dragOffset.current = {
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" onClick={onClose} />

      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Iniciar sesión"
        tabIndex={-1}
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto fixed w-[min(calc(100vw-2rem),448px)] rounded-2xl border border-gray-100 bg-white text-brand-navy shadow-xl"
      >
        <AuthCardHeader
          title={verificationStep ? "Verificación segura" : "Bienvenido a GTEL Talento"}
          subtitle={verificationStep ? "Ingresa el código enviado por WhatsApp" : "Inicia sesión para acceder a tu cuenta"}
          onPointerDown={handleDragStart}
          onClose={() => { resetState(); onClose?.(); }}
        />
        {!verificationStep && <div className="flex border-b border-gray-100 bg-[#F8FAFC]" role="group" aria-label="Tipo de usuario">
          {[{ value: "CANDIDATO", label: "Soy Candidato", icon: User }, { value: "RECLUTADOR", label: "Soy Reclutador", icon: Briefcase }].map(({ value, label, icon: Icon }) => (
            <button key={value} type="button" aria-pressed={form.rol === value}
              onClick={() => setForm(previous => ({ ...previous, rol: value }))}
              className={"flex flex-1 items-center justify-center gap-2 border-b-2 px-1 py-3.5 text-sm font-semibold transition " + (form.rol === value ? "border-brand-red bg-white text-brand-red" : "border-transparent text-slate-600 hover:text-brand-navy")}>
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </div>}

        {notice && <p role="status" className="mx-5 mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
        {verificationStep ? (
          <form onSubmit={handleVerificationSubmit} className="space-y-5 bg-white p-7" noValidate>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 shadow-sm">
              <div className="mb-3 flex items-center gap-2 font-semibold">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <MessageSquareText className="h-4 w-4" />
                </span>
                Código enviado por WhatsApp
              </div>
              <p className="text-xs text-emerald-700">Se envió un código al WhatsApp {session?.maskedPhone}.</p>
              <div className="mt-3 rounded-2xl border border-emerald-200 bg-white px-3 py-3 text-center shadow-inner shadow-emerald-100">
                <div className="text-xs uppercase tracking-wide text-slate-400">Revisa tu mensaje</div>
                <div className="mt-2 text-sm font-semibold text-slate-700">Ingresa el código de 6 dígitos recibido.</div>
              </div>
            </div>

            <OtpInput value={verificationCode} onChange={setVerificationCode} disabled={isSubmitting} />
            {IS_DEMO_MODE && <p className="rounded-lg bg-amber-50 px-3 py-2 text-center text-xs text-amber-800"><strong>Modo demo:</strong> usa el código 123456</p>}

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-red px-4 py-3 text-sm font-semibold text-white shadow-sm  transition hover:bg-brand-red-hover disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Verificando..." : "Verificar código"}
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || isSubmitting}
                className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-semibold text-brand-red transition hover:border-red-200 hover:bg-red-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
              >
                <span className="font-mono">{resendCooldown > 0 ? `${resendCooldown}s` : "↻"}</span>
                {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : "Volver a enviar código"}
              </button>

              <button
                type="button"
                onClick={() => {
                  resetState();
                }}
                className="text-xs text-slate-500 transition hover:text-slate-700"
              >
                Volver
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 p-7">
            <div className={"flex items-center gap-2.5 rounded-xl border p-3 text-xs " + (form.rol === "RECLUTADOR" ? "border-red-100 bg-red-50 text-brand-red" : "border-blue-100 bg-blue-50 text-blue-700")}>
              {form.rol === "RECLUTADOR" ? <Briefcase className="h-4 w-4 shrink-0" /> : <User className="h-4 w-4 shrink-0" />}
              {form.rol === "RECLUTADOR" ? "Panel ATS completo para gestión de reclutamiento." : "Accede a tus postulaciones y el estado de tus procesos."}
            </div>
            {IS_DEMO_MODE && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><strong>Accesos demo</strong><br />Candidato: candidato@gtel.com<br />Reclutador: reclutador@gtel.com<br />Contraseña: Demo123!</div>}



            <div>
              <label htmlFor="auth-email" className="mb-1.5 block text-xs font-semibold text-slate-700">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="auth-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-200"
                  placeholder={form.rol === "RECLUTADOR" ? "reclutador@gtel.com.pe" : "candidato@correo.com"}
                  autoComplete="username" required
                />
              </div>
            </div>

            <div>
              <label htmlFor="auth-password" className="mb-1.5 block text-xs font-semibold text-slate-700">
                Contraseña
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="auth-password"
                  autoComplete="current-password" required
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                  className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-11 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-200"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  aria-label="Mostrar u ocultar contraseña"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {IS_DEMO_MODE && <button
              type="button"
              onClick={() => setForm((previous) => ({ ...previous, email: previous.rol === "RECLUTADOR" ? "reclutador@gtel.com" : "candidato@gtel.com", password: "Demo123!" }))}
              className="w-full rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100"
            >
              Completar acceso demo como {form.rol === "RECLUTADOR" ? "reclutador" : "candidato"}
            </button>}

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-red px-4 py-2.5 text-sm font-semibold text-white shadow-sm  transition hover:bg-brand-red-hover disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Enviando código..." : "Ingresar"}
              <ArrowRight className="h-4 w-4" />
            </button>

            {form.rol === "CANDIDATO" && <div className="text-center text-xs text-slate-500">
              ¿Aún no tienes cuenta? <button type="button" onClick={onRegisterClick} className="font-semibold text-brand-red underline-offset-4 hover:underline">Crear mi cuenta</button>
            </div>}
          </form>
        )}
        <AuthCardFooter />
      </div>
    </div>
  );
}
