import { useEffect, useRef, useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, MessageSquareText, Move, ShieldCheck, X } from "lucide-react";

import useOtpLogin from "../../hooks/useOtpLogin";
import useModalFocus from "../../hooks/useModalFocus";
import OtpInput from "./OtpInput";
import { IS_DEMO_MODE } from "../../services/api";

export default function AuthModal({ isOpen, onClose, onSubmit, onRegisterClick, defaultRole = "CANDIDATO", notice = "" }) {
  const [form, setForm] = useState({ email: "", password: "", rol: defaultRole });
  const [showPassword, setShowPassword] = useState(false);
  const otp = useOtpLogin((user) => { onSubmit?.(user); onClose?.(); });
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
        x: Math.min(Math.max(20, nextX), window.innerWidth - width - 20),
        y: Math.min(Math.max(20, nextY), window.innerHeight - height - 20),
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
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto fixed w-[min(92vw,460px)] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-md backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95"
      >
        <div
          onPointerDown={handleDragStart}
          className="flex cursor-grab items-center justify-between gap-3 border-b border-slate-200 bg-brand-navy px-4 py-3 text-white active:cursor-grabbing dark:border-slate-700"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 shadow-inner shadow-white/10">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">{verificationStep ? "Verificación segura" : "Iniciar sesión"}</p>
              <p className="text-xs text-slate-300">{verificationStep ? "Código de acceso" : "Acceso seguro"}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              resetState();
              onClose?.();
            }}
            aria-label="Cerrar modal"
            className="rounded-full border border-white/15 bg-white/5 p-2 text-slate-200 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {notice && <p role="status" className="mx-5 mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
        {verificationStep ? (
          <form onSubmit={handleVerificationSubmit} className="space-y-4 bg-white p-5" noValidate>
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
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-red px-4 py-3 text-sm font-semibold text-white shadow-lg  transition hover:bg-brand-red-hover disabled:cursor-not-allowed disabled:opacity-70"
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
                className="text-xs text-slate-500 transition hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
              >
                Volver
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 p-5" noValidate>
            <div className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-700 dark:border-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
              <Move className="h-4 w-4" />
              Ingresa tus datos para continuar con tu cuenta.
            </div>
            {IS_DEMO_MODE && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><strong>Accesos demo</strong><br />Candidato: candidato@gtel.com<br />Reclutador: reclutador@gtel.com<br />Contraseña: Demo123!</div>}

            <fieldset>
              <legend className="mb-2 block text-sm font-medium text-slate-700">¿Cómo deseas ingresar?</legend>
              <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1" role="group" aria-label="Tipo de usuario">
                {[{ value: "CANDIDATO", label: "Candidato" }, { value: "RECLUTADOR", label: "Reclutador" }].map(({ value, label }) => <button
                  key={value}
                  type="button"
                  aria-pressed={form.rol === value}
                  onClick={() => setForm((previous) => ({ ...previous, rol: value }))}
                  className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${form.rol === value ? "bg-white text-brand-red shadow-sm" : "text-slate-500 hover:text-brand-navy"}`}
                >
                  {label}
                </button>)}
              </div>
            </fieldset>

            <div>
              <label htmlFor="auth-email" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="auth-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                  placeholder="usuario@empresa.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="auth-password" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Contraseña
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-11 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  aria-label="Mostrar u ocultar contraseña"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-red px-4 py-2.5 text-sm font-semibold text-white shadow-lg  transition hover:bg-brand-red-hover disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Enviando código..." : "Ingresar"}
              <ArrowRight className="h-4 w-4" />
            </button>

            {form.rol === "CANDIDATO" && <div className="text-center text-xs text-slate-500 dark:text-slate-300">
              ¿No tienes cuenta? <button type="button" onClick={onRegisterClick} className="font-semibold text-red-600 underline-offset-4 hover:underline">Regístrate aquí</button>
            </div>}
          </form>
        )}
      </div>
    </div>
  );
}
