import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Briefcase, Eye, EyeOff, Shield, ArrowRight, User, Lock, UserPlus } from "lucide-react";
import { loginCandidate, registerCandidate } from "../../services/api";

export default function LoginPage() {
  const location = useLocation();
  const [tab, setTab] = useState("candidate");
  const [showPass, setShowPass] = useState(false);
  const [registering, setRegistering] = useState(
    new URLSearchParams(location.search).get("registro") === "1"
  );
  const [form, setForm] = useState({ nombres: "", apellidos: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (tab === "candidate") {
      setLoading(true);
      try {
        const response = registering
          ? await registerCandidate(form)
          : await loginCandidate({
              email: form.email,
              password: form.password,
              rol: tab === "candidate" ? "CANDIDATO" : "RECLUTADOR",
            });
        localStorage.setItem("gtel-user", JSON.stringify(response.user));
        navigate("/mis-postulaciones");
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    try {
      const response = await loginCandidate({
        email: form.email,
        password: form.password,
        rol: "RECLUTADOR",
      });
      localStorage.setItem("gtel-user", JSON.stringify(response.user));
      navigate("/reclutador/dashboard");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg font-sans flex flex-col">
      <header className="bg-brand-navy px-6 py-4 flex items-center">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-red rounded-lg flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-sm">GTEL Talento</span>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Header de la tarjeta */}
            <div className="bg-gradient-to-br from-brand-navy to-slate-700 p-7 text-center">
              <div className="w-14 h-14 bg-brand-red rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Briefcase className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Bienvenido a GTEL Talento</h1>
              <p className="text-white/60 text-xs mt-1">Inicia sesión para acceder a tu cuenta</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 bg-brand-bg">
              <button
                onClick={() => setTab("candidate")}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all relative ${
                  tab === "candidate" ? "text-brand-red bg-white" : "text-brand-gray hover:text-brand-navy"
                }`}
              >
                <User className="w-4 h-4" /> Soy Candidato
                {tab === "candidate" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-red" />}
              </button>
              <button
                onClick={() => setTab("recruiter")}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all relative ${
                  tab === "recruiter" ? "text-brand-red bg-white" : "text-brand-gray hover:text-brand-navy"
                }`}
              >
                <Briefcase className="w-4 h-4" /> Soy Reclutador
                {tab === "recruiter" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-red" />}
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="p-7 space-y-5">
              {tab === "candidate" && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-2.5">
                  <User className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <p className="text-xs text-blue-700">Accede a tus postulaciones y el estado de tus procesos.</p>
                </div>
              )}
              {tab === "recruiter" && (
                <div className="bg-brand-red/10 border border-brand-red/20 rounded-xl p-3 flex items-center gap-2.5">
                  <Briefcase className="w-4 h-4 text-brand-red flex-shrink-0" />
                  <p className="text-xs text-brand-red">Panel ATS completo para gestión de reclutamiento.</p>
                </div>
              )}

              {registering && tab === "candidate" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input name="nombres" value={form.nombres} onChange={(e) => setForm({ ...form, nombres: e.target.value })} required placeholder="Nombres" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg" />
                  <input name="apellidos" value={form.apellidos} onChange={(e) => setForm({ ...form, apellidos: e.target.value })} required placeholder="Apellidos" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg" />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-brand-navy mb-1.5">Correo electrónico</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    name="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    type="email"
                    placeholder={tab === "recruiter" ? "reclutador@gtel.com.pe" : "candidato@correo.com"}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-brand-navy">Contraseña</label>
                  <a href="#" className="text-xs text-brand-red hover:underline">¿Olvidaste tu contraseña?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    name="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="remember" className="accent-brand-red" />
                <label htmlFor="remember" className="text-xs text-brand-gray">Recordar sesión en este dispositivo</label>
              </div>

              <button type="submit"
                className="w-full bg-brand-red hover:bg-red-700 text-white py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md">
                {loading ? "Procesando..." : registering ? "Crear cuenta" : "Ingresar"}
                {registering ? <UserPlus className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </button>

              {error && <p className="text-xs text-red-600 text-center">{error}</p>}

              {tab === "candidate" && (
                <div className="text-center">
                  <span className="text-xs text-brand-gray">{registering ? "¿Ya tienes cuenta? " : "¿Aún no tienes cuenta? "}</span>
                  <button type="button" onClick={() => setRegistering(!registering)} className="text-xs font-semibold text-brand-red hover:underline">
                    {registering ? "Inicia sesión" : "Regístrate aquí"}
                  </button>
                </div>
              )}
            </form>

            <div className="border-t border-gray-100 px-7 py-4 bg-brand-bg flex items-center justify-center gap-2">
              <Shield className="w-3.5 h-3.5 text-brand-gray" />
              <span className="text-[10px] text-brand-gray">Conexión segura con cifrado SSL/TLS</span>
            </div>
          </div>

          <p className="text-center text-[10px] text-brand-gray mt-5">
            © 2026 GTEL Telecomunicaciones · Plataforma de Reclutamiento
          </p>
        </div>
      </div>
    </div>
  );
}