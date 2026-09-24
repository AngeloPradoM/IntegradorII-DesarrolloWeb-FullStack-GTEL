import { useParams } from "react-router-dom";
import { getJobs } from "../../utils/jobsData";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Upload, FileText, Shield, CheckCircle, Clock, DollarSign, MapPin, ChevronRight, X, User, Phone, CreditCard, Mail, CalendarDays, ArrowLeft } from "lucide-react";
import { createApplication } from "../../services/api";
const steps = ["Información personal", "Documentos", "Confirmación"];
export default function ApplicationForm() {
  const {
    id
  } = useParams();
  const job = getJobs().find(item => String(item.id) === id) || getJobs()[0];
  const [currentStep, setCurrentStep] = useState(1);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const submitApplication = async () => {
    setSubmitError("");
    try { await createApplication(job); setSubmitted(true); }
    catch (error) { setSubmitError(error.message); }
  };
  const handleDrop = e => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setUploadedFile(file.name);
  };
  const handleFileInput = e => {
    const file = e.target.files?.[0];
    if (file) setUploadedFile(file.name);
  };
  if (submitted) {
    return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-[#1E293B] mb-2">¡Postulación enviada!</h2>
          <p className="text-sm text-[#475569] mb-6">
            Tu CV ha sido recibido. Un reclutador de GTEL revisará tu perfil y se contactará contigo en un plazo de 3 a 5 días hábiles.
          </p>
          <div className="bg-[#F8FAFC] rounded-xl p-4 mb-6 text-left">
            <div className="text-xs font-semibold text-[#1E293B] mb-2">Código de seguimiento</div>
            <div className="text-sm font-mono text-[#D32F2F] font-bold">GTEL-2026-0847</div>
          </div>
          <div className="flex gap-3">
            <Link to="/ofertas" className="flex-1 border border-gray-200 text-[#475569] py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors text-center">
              Ver más ofertas
            </Link>
            <Link to="/mis-postulaciones" className="flex-1 bg-[#D32F2F] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#B71C1C] transition-colors text-center">
              Mis postulaciones
            </Link>
          </div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-[#F8FAFC] py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Back */}
        <Link to="/ofertas" className="inline-flex items-center gap-1.5 text-sm text-[#475569] hover:text-[#1E293B] mb-5 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Volver a ofertas
        </Link>

        {/* Progress bar */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#475569] uppercase tracking-wide">
              Paso {currentStep} de {steps.length}
            </span>
            <span className="text-xs text-[#475569]">{steps[currentStep - 1]}</span>
          </div>
          <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#D32F2F] rounded-full transition-all duration-500" style={{
            width: `${currentStep / steps.length * 100}%`
          }} />
          </div>
          <div className="flex justify-between mt-3">
            {steps.map((step, i) => <div key={step} className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${i + 1 < currentStep ? "bg-[#D32F2F] border-[#D32F2F] text-white" : i + 1 === currentStep ? "border-[#D32F2F] text-[#D32F2F]" : "border-gray-200 text-gray-400"}`}>
                  {i + 1 < currentStep ? "✓" : i + 1}
                </div>
                <span className={`text-[10px] hidden sm:block ${i + 1 === currentStep ? "text-[#1E293B] font-semibold" : "text-[#475569]"}`}>
                  {step}
                </span>
              </div>)}
          </div>
        </div>

        {/* Main layout 60/40 */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left - Form (60%) */}
          <div className="flex-[3] space-y-5">
            {currentStep === 1 && <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-[#1E293B] mb-5">Información Personal</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-[#1E293B] mb-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        Nombres *
                      </label>
                      <input type="text" placeholder="Ingresa tus nombres" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]" />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-[#1E293B] mb-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        Apellidos *
                      </label>
                      <input type="text" placeholder="Ingresa tus apellidos" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-[#1E293B] mb-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                        DNI / Documento *
                      </label>
                      <input type="text" placeholder="12345678" maxLength={8} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]" />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-[#1E293B] mb-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        Celular *
                      </label>
                      <input type="tel" placeholder="987 654 321" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]" />
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-[#1E293B] mb-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      Correo electrónico *
                    </label>
                    <input type="email" placeholder="tu@correo.com" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-[#1E293B] mb-1.5">
                        <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                        Fecha de nacimiento
                      </label>
                      <input type="date" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Distrito</label>
                      <select className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]">
                        <option value="">Seleccionar...</option>
                        <option>Miraflores</option>
                        <option>San Isidro</option>
                        <option>Surco</option>
                        <option>La Molina</option>
                        <option>Barranco</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>}

            {currentStep === 2 && <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-[#1E293B] mb-5">Sube tu CV</h2>

                {/* Drag & Drop */}
                <label onDragOver={e => {
              e.preventDefault();
              setDragOver(true);
            }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop} className={`block border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${dragOver ? "border-[#D32F2F] bg-[#D32F2F]/5" : uploadedFile ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-[#D32F2F]/50 hover:bg-[#F8FAFC]"}`}>
                  <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileInput} />
                  {uploadedFile ? <div>
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <FileText className="w-6 h-6 text-green-600" />
                      </div>
                      <p className="text-sm font-semibold text-[#1E293B]">{uploadedFile}</p>
                      <p className="text-xs text-green-600 mt-1">Archivo listo para subir</p>
                      <button type="button" onClick={e => {
                  e.preventDefault();
                  setUploadedFile(null);
                }} className="mt-2 text-xs text-[#475569] hover:text-[#D32F2F] flex items-center gap-1 mx-auto">
                        <X className="w-3 h-3" /> Quitar archivo
                      </button>
                    </div> : <div>
                      <div className="w-12 h-12 bg-[#F8FAFC] rounded-xl flex items-center justify-center mx-auto mb-3 border border-gray-200">
                        <Upload className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm font-semibold text-[#1E293B]">Arrastra tu CV aquí</p>
                      <p className="text-xs text-[#475569] mt-1">o haz clic para seleccionar</p>
                      <p className="text-[10px] text-gray-400 mt-2">PDF, DOC, DOCX — máx. 5 MB</p>
                    </div>}
                </label>

                <div className="mt-5">
                  <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">
                    Carta de presentación (opcional)
                  </label>
                  <textarea rows={4} placeholder="Cuéntanos por qué eres el candidato ideal para esta posición..." className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] resize-none" />
                </div>
              </div>}

            {currentStep === 3 && <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-[#1E293B] mb-5">Confirma tu postulación</h2>
                <div className="space-y-3">
                  {[{
                label: "Nombre completo",
                value: "Luis Alberto Rodríguez Sánchez"
              }, {
                label: "DNI",
                value: "45672891"
              }, {
                label: "Celular",
                value: "987 654 321"
              }, {
                label: "Correo",
                value: "luis.rodriguez@gmail.com"
              }, {
                label: "CV adjunto",
                value: uploadedFile || "CV_Luis_Rodriguez.pdf"
              }].map(({
                label,
                value
              }) => <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <span className="text-xs text-[#475569]">{label}</span>
                      <span className="text-sm font-medium text-[#1E293B]">{value}</span>
                    </div>)}
                </div>
                <div className="mt-5 flex items-start gap-2">
                  <input type="checkbox" id="terms" className="mt-0.5 accent-[#D32F2F]" />
                  <label htmlFor="terms" className="text-xs text-[#475569] leading-relaxed">
                    Acepto los <a href="#" className="text-[#D32F2F] underline">términos de uso</a> y la{" "}
                    <a href="#" className="text-[#D32F2F] underline">política de privacidad</a> de GTEL Talento.
                    Autorizo el uso de mis datos para fines de selección de personal.
                  </label>
                </div>
              </div>}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between">
              {currentStep > 1 ? <button onClick={() => setCurrentStep(s => s - 1)} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-[#475569] rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                  ← Anterior
                </button> : <div />}
              {currentStep < steps.length ? <button onClick={() => setCurrentStep(s => s + 1)} className="flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors">
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </button> : <button onClick={submitApplication} className="flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors">
                  <CheckCircle className="w-4 h-4" />
                  Enviar Postulación
                </button>}
            </div>
            {submitError && <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{submitError}</p>}

            {/* Trust seal */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#1E293B]">Datos protegidos y seguros</div>
                <div className="text-[10px] text-[#475569]">Tu información está cifrada y protegida bajo la Ley 29733 de Protección de Datos Personales.</div>
              </div>
            </div>
          </div>

          {/* Right - Job summary (40%) */}
          <div className="flex-[2]">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden sticky top-6">
              <img src="https://images.unsplash.com/photo-1622675363311-3e1904dc1885?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&h=200" alt="Office" className="w-full h-36 object-cover" />
              <div className="p-5">
                <div className="inline-flex items-center gap-1 bg-[#D32F2F]/10 text-[#D32F2F] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase mb-2">
                  Full-Time
                </div>
                <h3 className="font-bold text-[#1E293B] mb-1">{job?.title}</h3>
                <p className="text-xs text-[#475569] mb-4">GTEL Telecomunicaciones — Lima</p>

                <ul className="space-y-2.5 mb-4">
                  {[{
                  icon: DollarSign,
                  text: job?.salary || "Por confirmar"
                }, {
                  icon: Clock,
                  text: "Lunes a Sábado, 8h/día"
                }, {
                  icon: MapPin,
                  text: job?.location || "Por confirmar"
                }, {
                  icon: CalendarDays,
                  text: "Incorporación inmediata"
                }].map(({
                  icon: Icon,
                  text
                }) => <li key={text} className="flex items-center gap-2 text-xs text-[#475569]">
                      <div className="w-6 h-6 bg-[#F8FAFC] rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 text-[#D32F2F]" />
                      </div>
                      {text}
                    </li>)}
                </ul>

                <div className="border-t border-gray-100 pt-4">
                  <p className="text-[10px] font-semibold text-[#1E293B] mb-2">Beneficios incluidos</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["Seguro médico", "Bonos", "Capacitación", "Comisiones"].map(b => <span key={b} className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">
                        {b}
                      </span>)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
}
