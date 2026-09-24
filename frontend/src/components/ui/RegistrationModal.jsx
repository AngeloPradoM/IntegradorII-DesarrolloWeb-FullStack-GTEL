import { useEffect, useRef, useState } from "react";
import useModalFocus from "../../hooks/useModalFocus";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

const DEPARTAMENTOS = [
  "Amazonas",
  "Ancash",
  "Apurímac",
  "Arequipa",
  "Ayacucho",
  "Cajamarca",
  "Callao",
  "Cusco",
  "Huancavelica",
  "Huánuco",
  "Ica",
  "Junín",
  "La Libertad",
  "Lambayeque",
  "Lima",
  "Loreto",
  "Madre de Dios",
  "Moquegua",
  "Pasco",
  "Piura",
  "Puno",
  "San Martín",
  "Tacna",
  "Tumbes",
  "Ucayali",
];

const PHONE_PREFIX = "+51";

const stripControlCharacters = (value = "") => {
  return Array.from(value).filter((char) => {
    const code = char.charCodeAt(0);
    return code !== 0 && code !== 127 && code > 31;
  }).join("");
};

const sanitizeText = (value = "") =>
  stripControlCharacters(value)
    .replace(/[<>]/g, "")
    .replace(/\\/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

const sanitizeEmail = (value = "") =>
  stripControlCharacters(value)
    .replace(/[<>]/g, "")
    .trim()
    .toLowerCase();

const sanitizePhone = (value = "") => value.replace(/\D/g, "").slice(0, 9);

const getPasswordStrength = (password = "") => {
  let score = 0;
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };

  Object.values(checks).forEach((valid) => {
    if (valid) score += 20;
  });

  if (!password) return { score: 0, label: "Sin contraseña", tone: "bg-slate-200", text: "text-slate-500" };

  if (score <= 20) {
    return { score, label: "Débil", tone: "bg-red-500", text: "text-red-600" };
  }
  if (score <= 40) {
    return { score, label: "Medio", tone: "bg-amber-500", text: "text-amber-600" };
  }
  if (score <= 60) {
    return { score, label: "Fuerte", tone: "bg-blue-500", text: "text-blue-600" };
  }
  return { score, label: "Muy fuerte", tone: "bg-emerald-500", text: "text-emerald-600" };
};

export default function RegistrationModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState({
    nombres: "",
    apellidos: "",
    email: "",
    telefono: "",
    ubicacion: "",
    password: "",
    confirmarPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const modalRef = useRef(null);
  useModalFocus(modalRef, isOpen, onClose);
  const dragOffset = useRef({ x: 0, y: 0 });

  const passwordStrength = getPasswordStrength(form.password);

  const clampPosition = (x, y) => {
    const width = modalRef.current?.offsetWidth || 640;
    const height = modalRef.current?.offsetHeight || 700;
    const maxX = Math.max(18, window.innerWidth - width - 18);
    const maxY = Math.max(18, window.innerHeight - height - 18);

    return {
      x: Math.min(Math.max(18, x), maxX),
      y: Math.min(Math.max(18, y), maxY),
    };
  };

  useEffect(() => {
    if (!isOpen) return;

    const initialX = (window.innerWidth - (modalRef.current?.offsetWidth || 640)) / 2;
    const initialY = Math.max(30, (window.innerHeight - (modalRef.current?.offsetHeight || 720)) / 2);
    setPosition(clampPosition(initialX, initialY));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isDragging) return;

    const handlePointerMove = (event) => {
      setPosition(() => clampPosition(event.clientX - dragOffset.current.x, event.clientY - dragOffset.current.y));
    };

    const handlePointerUp = () => setIsDragging(false);

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isOpen, isDragging]);

  const updateField = (field, value) => {
    if (field === "nombres" || field === "apellidos") {
      const cleanValue = sanitizeText(value).replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]/g, "");
      setForm((prev) => ({ ...prev, [field]: cleanValue }));
      return;
    }

    if (field === "email") {
      setForm((prev) => ({ ...prev, email: sanitizeEmail(value) }));
      return;
    }

    if (field === "telefono") {
      setForm((prev) => ({ ...prev, telefono: sanitizePhone(value) }));
      return;
    }

    if (field === "ubicacion") {
      setForm((prev) => ({ ...prev, ubicacion: sanitizeText(value) }));
      return;
    }

    if (field === "password") {
      setForm((prev) => ({ ...prev, password: value }));
      return;
    }

    if (field === "confirmarPassword") {
      setForm((prev) => ({ ...prev, confirmarPassword: value }));
    }
  };

  const validate = () => {
    const nextErrors = {};
    const namePattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]{2,}$/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

    if (!form.nombres || !namePattern.test(form.nombres)) {
      nextErrors.nombres = "Ingrese un nombre válido (mínimo 2 caracteres).";
    }

    if (!form.apellidos || !namePattern.test(form.apellidos)) {
      nextErrors.apellidos = "Ingrese un apellido válido (mínimo 2 caracteres).";
    }

    if (!form.email || !emailPattern.test(form.email)) {
      nextErrors.email = "El correo electrónico no es válido.";
    }

    if (!form.telefono || form.telefono.length !== 9) {
      nextErrors.telefono = "El teléfono debe tener 9 dígitos.";
    }

    if (!form.ubicacion) {
      nextErrors.ubicacion = "Seleccione su departamento.";
    }

    if (!form.password || form.password.length < 8) {
      nextErrors.password = "La contraseña debe tener al menos 8 caracteres.";
    }

    const hasStrongPassword = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(form.password || "");
    if (form.password && !hasStrongPassword) {
      nextErrors.password = "La contraseña debe incluir mayúsculas, minúsculas, números y símbolos.";
    }

    if (!form.confirmarPassword || form.confirmarPassword !== form.password) {
      nextErrors.confirmarPassword = "Las contraseñas no coinciden.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting || !validate()) return;

    const payload = {
      nombres: form.nombres.trim(),
      apellidos: form.apellidos.trim(),
      email: form.email.trim(),
      telefono: `${PHONE_PREFIX}${form.telefono}`,
      ubicacion: form.ubicacion,
      password: form.password,
    };

    setSubmitting(true);
    setSubmitError("");
    try { await onSubmit?.(payload); onClose(); }
    catch (e) { setSubmitError(e.message || "No se pudo registrar la cuenta"); }
    finally { setSubmitting(false); }
  };

  const handleDragStart = (event) => {
    const target = event.target;
    if (target.closest("input") || target.closest("button") || target.closest("select") || target.closest("textarea")) {
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
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onClose} />

      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Registrarse"
        tabIndex={-1}
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto fixed w-[min(94vw,640px)] rounded-2xl border border-slate-200/70 bg-white shadow-md backdrop-blur-xl dark:bg-slate-900/95 dark:border-slate-700/80" 
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
      >
        <div
          className="flex cursor-grab items-center justify-between gap-3 rounded-t-2xl border-b border-slate-200 bg-brand-navy px-5 py-4 text-white active:cursor-grabbing dark:border-slate-700"
          onPointerDown={handleDragStart}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
              <UserRound className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide">Registro de usuario</p>
              <p className="text-xs text-slate-300">Comienza con tus datos de contacto</p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Cerrar modal"
            onClick={onClose}
            className="rounded-full border border-white/15 bg-white/5 p-2 text-slate-200 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[78vh] overflow-y-auto px-5 py-5">
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {submitError && <p role="alert" className="text-sm text-red-600">{submitError}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="nombres" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Nombre
                </label>
                <input
                  id="nombres"
                  value={form.nombres}
                  onChange={(event) => updateField("nombres", event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-brand-red focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                  placeholder="Ej. Carlos"
                  autoComplete="given-name"
                  aria-invalid={Boolean(errors.nombres)}
                />
                {errors.nombres && <p className="mt-1 text-xs text-red-600">{errors.nombres}</p>}
              </div>

              <div>
                <label htmlFor="apellidos" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Apellido
                </label>
                <input
                  id="apellidos"
                  value={form.apellidos}
                  onChange={(event) => updateField("apellidos", event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-brand-red focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                  placeholder="Ej. Pérez"
                  autoComplete="family-name"
                  aria-invalid={Boolean(errors.apellidos)}
                />
                {errors.apellidos && <p className="mt-1 text-xs text-red-600">{errors.apellidos}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-brand-red focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                  placeholder="nombre@empresa.com"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="telefono" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Número de teléfono
              </label>

              <div className="flex items-center gap-2">
                <div className="flex h-[42px] min-w-[84px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                  {PHONE_PREFIX}
                </div>
                <div className="relative flex-1">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="telefono"
                    type="tel"
                    inputMode="numeric"
                    value={form.telefono}
                    onChange={(event) => updateField("telefono", event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-brand-red focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                    placeholder="987654321"
                    autoComplete="tel"
                    aria-invalid={Boolean(errors.telefono)}
                  />
                </div>
              </div>
              {errors.telefono && <p className="mt-1 text-xs text-red-600">{errors.telefono}</p>}
            </div>

            <div>
              <label htmlFor="ubicacion" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Lugar de ubicación
              </label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  id="ubicacion"
                  value={form.ubicacion}
                  onChange={(event) => updateField("ubicacion", event.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 py-2.5 text-sm text-slate-800 transition focus:border-brand-red focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  aria-invalid={Boolean(errors.ubicacion)}
                >
                  <option value="">Selecciona un departamento</option>
                  {DEPARTAMENTOS.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>
              {errors.ubicacion && <p className="mt-1 text-xs text-red-600">{errors.ubicacion}</p>}
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(event) => updateField("password", event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 pr-11 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-brand-red focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                  placeholder="Ingrese una contraseña segura"
                  aria-invalid={Boolean(errors.password)}
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

              <div className="mt-2">
                <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
                  <span>Fortaleza de contraseña</span>
                  <span className={passwordStrength.text}>{passwordStrength.label}</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[0, 1, 2, 3, 4].map((item) => {
                    const active = item < Math.ceil(passwordStrength.score / 20);
                    return (
                      <span
                        key={item}
                        className={`h-2 rounded-full ${active ? passwordStrength.tone : "bg-slate-200 dark:bg-slate-700"}`}
                      />
                    );
                  })}
                </div>
              </div>

              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirmarPassword" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  id="confirmarPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirmarPassword}
                  onChange={(event) => updateField("confirmarPassword", event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 pr-11 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-brand-red focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                  placeholder="Repetir contraseña"
                  aria-invalid={Boolean(errors.confirmarPassword)}
                />
                <button
                  type="button"
                  aria-label="Mostrar u ocultar confirmación"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmarPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmarPassword}</p>}
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-700/60 dark:bg-amber-500/10">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" />
                <p className="text-xs leading-5 text-amber-800 dark:text-amber-200">
                  La verificación de dos pasos (2FA) por WhatsApp se configurará y validará al momento de iniciar sesión por primera vez tras el registro.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800 dark:border-emerald-600/50 dark:bg-emerald-500/10 dark:text-emerald-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                <span>Protección de datos y cifrado seguro</span>
              </div>
              <CheckCircle2 className="h-4 w-4" />
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit" disabled={submitting}
                className="rounded-xl bg-brand-red px-4 py-2.5 text-sm font-semibold text-white shadow-lg  transition hover:bg-brand-red-hover"
              >
                Crear cuenta
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
