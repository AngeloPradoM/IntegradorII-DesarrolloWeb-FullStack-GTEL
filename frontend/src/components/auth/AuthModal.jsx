import { useEffect, useRef, useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, MessageSquareText } from "lucide-react";

import useOtpLogin from "../../hooks/useOtpLogin";
import useModalFocus from "../../hooks/useModalFocus";
import AuthCardHeader from "./AuthCardHeader";
import AuthCardFooter from "./AuthCardFooter";
import OtpInput from "./OtpInput";


export default function AuthModal({ isOpen, onClose, onSubmit, onRegisterClick, notice = "" }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const otp = useOtpLogin((user) => { if (onSubmit) onSubmit(user); else onClose?.(); });
  const { session, verificationStep, verificationCode, setVerificationCode, error, loading: isSubmitting, resendCooldown } = otp;
  const [isDragging, setIsDragging] = useState(false);
  const modalRef = useRef(null);
  const handleClose = () => {
    otp.reset();
    setForm({ email: "", password: "" });
    setShowPassword(false);
    setIsDragging(false);
    onClose?.();
  };
  useModalFocus(modalRef, isOpen, handleClose);
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
    otp.start({ email: form.email.trim(), password: form.password });
    setForm(previous => ({ ...previous, password: "" }));
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
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" onClick={handleClose} />

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
          subtitle={verificationStep ? "Ingresa el código enviado por correo electrónico" : "Inicia sesión para acceder a tu cuenta"}
          onPointerDown={handleDragStart}
          onClose={handleClose}
        />


        {notice && <p role="status" className="mx-5 mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
        {verificationStep ? (
          <form onSubmit={handleVerificationSubmit} className="space-y-5 bg-white p-7" noValidate>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 shadow-sm">
              <div className="mb-3 flex items-center gap-2 font-semibold">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <MessageSquareText className="h-4 w-4" />
                </span>
                Código enviado por correo electrónico
              </div>
              <p className="text-xs text-emerald-700">Se envió un código a {session?.maskedEmail}.</p>
              <div className="mt-3 rounded-2xl border border-emerald-200 bg-white px-3 py-3 text-center shadow-inner shadow-emerald-100">
                <div className="text-xs uppercase tracking-wide text-slate-400">Revisa tu mensaje</div>
                <div className="mt-2 text-sm font-semibold text-slate-700">Ingresa el código de 6 dígitos recibido.</div>
              </div>
            </div>

            <OtpInput value={verificationCode} onChange={setVerificationCode} disabled={isSubmitting} />

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
            <p className="text-sm text-slate-600">Ingresa con tu correo y contraseña.</p>



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
                  placeholder="tu@correo.com"
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

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-red px-4 py-2.5 text-sm font-semibold text-white shadow-sm  transition hover:bg-brand-red-hover disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Ingresando..." : "Ingresar"}
              <ArrowRight className="h-4 w-4" />
            </button>

            {<div className="text-center text-xs text-slate-500">
              ¿Aún no tienes cuenta? <button type="button" onClick={onRegisterClick} className="font-semibold text-brand-red underline-offset-4 hover:underline">Crear mi cuenta</button>
            </div>}
          </form>
        )}
        <AuthCardFooter />
      </div>
    </div>
  );
}
