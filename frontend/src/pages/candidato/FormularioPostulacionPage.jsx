import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Upload, FileText, Shield, CheckCircle, Clock, DollarSign,
  MapPin, ChevronRight, X, User, Phone, CreditCard, Mail,
} from "lucide-react";

const steps = ["Información personal", "Documentos", "Confirmación"];

export default function FormularioPostulacionPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setUploadedFile(file.name);
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) setUploadedFile(file.name);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-brand-navy mb-2">¡Postulación enviada!</h2>
          <p className="text-sm text-brand-gray mb-6">
            Tu CV ha sido recibido. Un reclutador de GTEL revisará tu perfil y se
            contactará contigo en un plazo de 3 a 5 días hábiles.
          </p>
          <div className="flex gap-3">
            <Link to="/ofertas" className="flex-1 border border-gray-200 text-brand-gray py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors text-center">
              Ver más ofertas
            </Link>
            <Link to="/mis-postulaciones" className="flex-1 bg-brand-red text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors text-center">
              Mis postulaciones
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Barra de progreso */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-brand-gray uppercase tracking-wide">
              Paso {currentStep} de {steps.length}
            </span>
            <span className="text-xs text-brand-gray">{steps[currentStep - 1]}</span>
          </div>
          <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-red rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Layout 60/40 */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Izquierda - Formulario (60%) */}
          <div className="flex-[3] space-y-5">
            {currentStep === 1 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-brand-navy mb-5">Información Personal</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-brand-navy mb-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400" /> Nombres *
                      </label>
                      <input type="text" placeholder="Ingresa tus nombres"
                        className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red" />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-brand-navy mb-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400" /> Apellidos *
                      </label>
                      <input type="text" placeholder="Ingresa tus apellidos"
                        className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-brand-navy mb-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-gray-400" /> DNI *
                      </label>
                      <input type="text" placeholder="12345678" maxLength={8}
                        className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red" />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-brand-navy mb-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400" /> Celular *
                      </label>
                      <input type="tel" placeholder="987 654 321"
                        className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red" />
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-brand-navy mb-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400" /> Correo electrónico *
                    </label>
                    <input type="email" placeholder="tu@correo.com"
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red" />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-brand-navy mb-5">Sube tu CV</h2>
                <label
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`block border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                    dragOver ? "border-brand-red bg-red-50"
                    : uploadedFile ? "border-green-400 bg-green-50"
                    : "border-gray-200 hover:border-brand-red/50 hover:bg-brand-bg"
                  }`}
                >
                  <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileInput} />
                  {uploadedFile ? (
                    <div>
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <FileText className="w-6 h-6 text-green-600" />
                      </div>
                      <p className="text-sm font-semibold text-brand-navy">{uploadedFile}</p>
                      <p className="text-xs text-green-600 mt-1">Archivo listo para subir</p>
                      <button type="button" onClick={(e) => { e.preventDefault(); setUploadedFile(null); }}
                        className="mt-2 text-xs text-brand-gray hover:text-brand-red flex items-center gap-1 mx-auto">
                        <X className="w-3 h-3" /> Quitar archivo
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="w-12 h-12 bg-brand-bg rounded-xl flex items-center justify-center mx-auto mb-3 border border-gray-200">
                        <Upload className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm font-semibold text-brand-navy">Arrastra tu CV aquí</p>
                      <p className="text-xs text-brand-gray mt-1">o haz clic para seleccionar</p>
                      <p className="text-[10px] text-gray-400 mt-2">PDF, DOC, DOCX — máx. 5 MB</p>
                    </div>
                  )}
                </label>
              </div>
            )}

            {currentStep === 3 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-brand-navy mb-5">Confirma tu postulación</h2>
                <div className="mt-2 flex items-start gap-2">
                  <input type="checkbox" id="terms" className="mt-0.5 accent-brand-red" />
                  <label htmlFor="terms" className="text-xs text-brand-gray leading-relaxed">
                    Acepto los términos de uso y la política de privacidad de GTEL Talento.
                  </label>
                </div>
              </div>
            )}

            {/* Navegación */}
            <div className="flex items-center justify-between">
              {currentStep > 1 ? (
                <button onClick={() => setCurrentStep((s) => s - 1)}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-brand-gray rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                  ← Anterior
                </button>
              ) : <div />}
              {currentStep < steps.length ? (
                <button onClick={() => setCurrentStep((s) => s + 1)}
                  className="flex items-center gap-2 bg-brand-red hover:bg-red-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors">
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={() => setSubmitted(true)}
                  className="flex items-center gap-2 bg-brand-red hover:bg-red-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors">
                  <CheckCircle className="w-4 h-4" /> Enviar Postulación
                </button>
              )}
            </div>

            {/* Sello de confianza */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <div className="text-xs font-semibold text-brand-navy">Datos protegidos y seguros</div>
                <div className="text-[10px] text-brand-gray">Tu información está cifrada y protegida.</div>
              </div>
            </div>
          </div>

          {/* Derecha - Resumen de la oferta (40%) */}
          <div className="flex-[2]">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden sticky top-6">
              <div className="p-5">
                <h3 className="font-bold text-brand-navy mb-1">Agente de Ventas Telefónicas</h3>
                <p className="text-xs text-brand-gray mb-4">GTEL Telecomunicaciones — Lima</p>
                <ul className="space-y-2.5 mb-4">
                  {[
                    { icon: DollarSign, text: "S/ 1,800 - 2,500 mensual" },
                    { icon: Clock, text: "Lunes a Sábado, 8h/día" },
                    { icon: MapPin, text: "San Isidro, Lima" },
                  ].map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-center gap-2 text-xs text-brand-gray">
                      <Icon className="w-3.5 h-3.5 text-brand-red" /> {text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}