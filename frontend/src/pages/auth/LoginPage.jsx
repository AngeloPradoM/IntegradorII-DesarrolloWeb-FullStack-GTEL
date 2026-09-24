import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Briefcase, Eye, EyeOff, Shield, ArrowRight, User, Lock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import useOtpLogin from "../../hooks/useOtpLogin";
import { IS_DEMO_MODE, registerCandidate } from "../../services/api";
import OtpInput from "../../components/auth/OtpInput";
export default function LoginPage() {
  const location = useLocation();
  const [tab, setTab] = useState("candidate");
  const [showPass, setShowPass] = useState(false);
  const [registering, setRegistering] = useState(new URLSearchParams(location.search).get("registro") === "1");
  const [form, setForm] = useState({
    nombres: "",
    apellidos: "",
    email: "",
    password: "",
    telefono: ""
  });
  const navigate = useNavigate();
  const {
    login
  } = useAuth();
  const otp = useOtpLogin(user => {
    login(user);
    const next = new URLSearchParams(location.search).get("redirect");
    const candidateRoute = next && /^\/(postulacion(?:\/\d+)?|mis-postulaciones|perfil)$/.test(next) ? next : "/mis-postulaciones";
    navigate(user.rol === "RECLUTADOR" ? "/reclutador/dashboard" : candidateRoute);
  });
  const {
    session,
    verificationStep,
    verificationCode,
    setVerificationCode,
    error,
    setError,
    loading,
    resendCooldown
  } = otp;
  const [registerLoading, setRegisterLoading] = useState(false);
  const handleSubmit = async event => {
    event.preventDefault();
    if (loading || registerLoading) return;
    setError("");
    if (registering && tab === "candidate") {
      setRegisterLoading(true);
      try {
        await registerCandidate(form);
        setRegistering(false);
      } catch (e) {
        setError(e.message);
        return;
      } finally {
        setRegisterLoading(false);
      }
    }
    await otp.start({
      email: form.email,
      password: form.password,
      rol: tab === "candidate" ? "CANDIDATO" : "RECLUTADOR"
    });
  };
  const handleResendOtp = otp.resend;
  const handleVerificationSubmit = event => {
    event.preventDefault();
    otp.verify();
  };
  return <div className="min-h-screen bg-[#F8FAFC] font-['Inter',sans-serif] flex flex-col">
      {/* Simple nav */}
      <header className="bg-[#1E293B] px-6 py-4 flex items-center">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#D32F2F] rounded-lg flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-sm">GTEL Talento</span>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-br from-[#1E293B] to-[#334155] p-7 text-center">
              <div className="w-14 h-14 bg-[#D32F2F] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Briefcase className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Bienvenido a GTEL Talento</h1>
              <p className="text-white/60 text-xs mt-1">Inicia sesión para acceder a tu cuenta</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 bg-[#F8FAFC]">
              <button onClick={() => setTab("candidate")} className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all relative ${tab === "candidate" ? "text-[#D32F2F] bg-white" : "text-[#475569] hover:text-[#1E293B]"}`}>
                <User className="w-4 h-4" />
                Soy Candidato
                {tab === "candidate" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D32F2F]" />}
              </button>
              <button onClick={() => setTab("recruiter")} className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all relative ${tab === "recruiter" ? "text-[#D32F2F] bg-white" : "text-[#475569] hover:text-[#1E293B]"}`}>
                <Briefcase className="w-4 h-4" />
                Soy Reclutador
                {tab === "recruiter" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D32F2F]" />}
              </button>
            </div>

            {/* Form */}
            {IS_DEMO_MODE && !verificationStep && <div className="mx-7 mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900"><strong>Credenciales demo</strong><br />Candidato: candidato@gtel.com<br />Reclutador: reclutador@gtel.com<br />Contraseña: Demo123!</div>}
            {verificationStep ? <form onSubmit={handleVerificationSubmit} className="p-7 space-y-5">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  <p className="font-semibold">Código de verificación enviado</p>
                  <p className="mt-1 text-xs text-emerald-700">Se envió un mensaje por WhatsApp al número {session?.maskedPhone}.</p>
                </div>

                <OtpInput value={verificationCode} onChange={setVerificationCode} disabled={loading} />
                {IS_DEMO_MODE && <p className="rounded-lg bg-amber-50 px-3 py-2 text-center text-xs text-amber-800"><strong>Modo demo:</strong> usa 123456</p>}

                {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {error}
                  </div>}

                <button type="submit" disabled={loading || registerLoading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-red px-4 py-3 text-sm font-bold text-white shadow-lg  transition hover:bg-brand-red-hover">
                  Verificar código
                  <ArrowRight className="h-4 w-4" />
                </button>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <button type="button" onClick={handleResendOtp} disabled={resendCooldown > 0 || loading} className="text-xs font-semibold text-brand-red transition hover:text-brand-navy disabled:cursor-not-allowed disabled:text-slate-400">
                    {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : "Volver a enviar código"}
                  </button>

                  <button type="button" onClick={() => otp.reset()} className="text-xs font-medium text-brand-gray transition hover:text-brand-navy">
                    Volver
                  </button>
                </div>
              </form> : <form onSubmit={handleSubmit} className="p-7 space-y-5">
  {registering && tab === "candidate" && <>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-xs font-semibold text-brand-navy">Nombres<input name="nombres" required value={form.nombres} onChange={e => setForm({
                    ...form,
                    nombres: e.target.value
                  })} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm" /></label>
      <label className="text-xs font-semibold text-brand-navy">Apellidos<input name="apellidos" required value={form.apellidos} onChange={e => setForm({
                    ...form,
                    apellidos: e.target.value
                  })} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm" /></label>
    </div>
    <label className="block text-xs font-semibold text-brand-navy">WhatsApp (código de país)<input name="telefono" type="tel" required pattern="[+][1-9][0-9]{7,14}" placeholder="+51987654321" value={form.telefono} onChange={e => setForm({
                  ...form,
                  telefono: e.target.value
                })} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm" /></label>
  </>}
  {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
              {tab === "candidate" && <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-2.5">
                  <User className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <p className="text-xs text-blue-700">Accede a tus postulaciones y el estado de tus procesos.</p>
                </div>}
              {tab === "recruiter" && <div className="bg-[#D32F2F]/10 border border-[#D32F2F]/20 rounded-xl p-3 flex items-center gap-2.5">
                  <Briefcase className="w-4 h-4 text-[#D32F2F] flex-shrink-0" />
                  <p className="text-xs text-[#D32F2F]">Panel ATS completo para gestión de reclutamiento.</p>
                </div>}

              <div>
                <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input name="email" required value={form.email} onChange={e => setForm({
                  ...form,
                  email: e.target.value
                })} type="email" placeholder={tab === "recruiter" ? "reclutador@gtel.com.pe" : "candidato@correo.com"} className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#1E293B]">Contraseña</label>
                  <a href="#" className="text-xs text-[#D32F2F] hover:underline">¿Olvidaste tu contraseña?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type={showPass ? "text" : "password"} placeholder="••••••••" name="password" required minLength={registering ? 8 : undefined} value={form.password} onChange={e => setForm({
                  ...form,
                  password: e.target.value
                })} className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="remember" className="accent-[#D32F2F]" />
                <label htmlFor="remember" className="text-xs text-[#475569]">Recordar sesión en este dispositivo</label>
              </div>

              <button type="submit" disabled={loading || registerLoading} className="w-full bg-[#D32F2F] hover:bg-[#B71C1C] text-white py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md">
                {loading || registerLoading ? "Procesando..." : registering ? "Crear cuenta" : "Ingresar"}
                <ArrowRight className="w-4 h-4" />
              </button>

              {tab === "candidate" && <div className="text-center">
                  <span className="text-xs text-[#475569]">{registering ? "¿Ya tienes cuenta? " : "¿Aún no tienes cuenta? "}</span>
                  <button type="button" onClick={() => setRegistering(!registering)} className="text-xs font-semibold text-[#D32F2F] hover:underline">{registering ? "Iniciar sesión" : "Crear mi cuenta"}</button>
                </div>}
            </form>}

            {/* Security footer */}
            <div className="border-t border-gray-100 px-7 py-4 bg-[#F8FAFC] flex items-center justify-center gap-2">
              <Shield className="w-3.5 h-3.5 text-[#475569]" />
              <span className="text-[10px] text-[#475569]">Conexión segura con cifrado SSL/TLS</span>
            </div>
          </div>

          <p className="text-center text-[10px] text-[#475569] mt-5">
            © 2026 GTEL Telecomunicaciones · Plataforma de Reclutamiento
          </p>
        </div>
      </div>
    </div>;
}
