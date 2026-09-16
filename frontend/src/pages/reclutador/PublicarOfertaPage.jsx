import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bold, Italic, List, AlignLeft, Minus, Save, X, ChevronDown,
  FileText, DollarSign, MapPin, Clock, Users, Tag, AlertCircle,
} from "lucide-react";

export default function PublicarOfertaPage() {
  const [description, setDescription] = useState(
    "Buscamos un profesional dinámico y orientado a resultados para unirse a nuestro equipo de ventas telefónicas. El candidato ideal tendrá:\n\n• Experiencia en ventas o atención al cliente\n• Excelentes habilidades de comunicación oral\n• Capacidad para trabajar bajo presión\n• Disponibilidad para trabajar en turnos"
  );
  const [published, setPublished] = useState(false);

  if (published) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 max-w-md text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-brand-navy mb-2">¡Oferta publicada!</h2>
          <p className="text-sm text-brand-gray mb-5">La oferta laboral ha sido publicada y está visible para los candidatos.</p>
          <div className="flex gap-3">
            <button onClick={() => setPublished(false)}
              className="flex-1 border border-gray-200 text-brand-gray py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">
              Publicar otra
            </button>
            <Link to="/reclutador/postulantes" className="flex-1 bg-brand-red text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 text-center">
              Ver candidatos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-brand-navy">Publicar Nueva Oferta</h1>
          <p className="text-sm text-brand-gray">Completa los campos para crear una nueva vacante</p>
        </div>
        <div className="flex gap-3">
          <Link to="/reclutador/dashboard"
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-brand-gray rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            <X className="w-4 h-4" /> Cancelar
          </Link>
          <button onClick={() => setPublished(true)}
            className="flex items-center gap-2 bg-brand-red hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors">
            <Save className="w-4 h-4" /> Publicar Oferta
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {/* Información básica */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-brand-bg border-b border-gray-100 px-5 py-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-red" />
            <h2 className="font-bold text-brand-navy text-sm">Información Básica</h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-brand-navy mb-1.5">Título del puesto *</label>
              <input type="text" placeholder="Ej: Agente de Ventas Telefónicas Senior" defaultValue="Agente de Ventas Telefónicas"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-brand-navy mb-1.5">
                  <Users className="w-3.5 h-3.5 text-gray-400" /> Departamento / Área *
                </label>
                <div className="relative">
                  <select className="w-full appearance-none px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red">
                    <option>Ventas</option><option>Soporte Técnico</option><option>Supervisión</option>
                    <option>Recursos Humanos</option><option>Calidad</option><option>Operaciones</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-brand-navy mb-1.5">
                  <Tag className="w-3.5 h-3.5 text-gray-400" /> Número de vacantes
                </label>
                <input type="number" min="1" defaultValue="3"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red" />
              </div>
            </div>
          </div>
        </div>

        {/* Condiciones laborales */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-brand-bg border-b border-gray-100 px-5 py-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-brand-red" />
            <h2 className="font-bold text-brand-navy text-sm">Condiciones Laborales</h2>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-brand-navy mb-1.5">
                <DollarSign className="w-3.5 h-3.5 text-gray-400" /> Sueldo mínimo (S/)
              </label>
              <input type="number" defaultValue="1800"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red" />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-brand-navy mb-1.5">
                <DollarSign className="w-3.5 h-3.5 text-gray-400" /> Sueldo máximo (S/)
              </label>
              <input type="number" defaultValue="2500"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red" />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-brand-navy mb-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-400" /> Tipo de jornada *
              </label>
              <div className="relative">
                <select className="w-full appearance-none px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red">
                  <option>Full-Time (8 horas)</option><option>Part-Time (4 horas)</option>
                  <option>Por turnos</option><option>Freelance</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-brand-navy mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400" /> Modalidad
              </label>
              <div className="relative">
                <select className="w-full appearance-none px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red">
                  <option>Presencial</option><option>Remoto</option><option>Híbrido</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-brand-navy mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400" /> Sede / Ubicación
              </label>
              <input type="text" defaultValue="San Isidro, Lima"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-navy mb-1.5">Fecha límite de postulación</label>
              <input type="date" defaultValue="2026-06-15"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red" />
            </div>
          </div>
        </div>

        {/* Descripción WYSIWYG */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-brand-bg border-b border-gray-100 px-5 py-3 flex items-center gap-2">
            <AlignLeft className="w-4 h-4 text-brand-red" />
            <h2 className="font-bold text-brand-navy text-sm">Descripción del Puesto</h2>
          </div>
          <div className="border-b border-gray-100 px-5 py-2 flex items-center gap-1 flex-wrap">
            {[{ icon: Bold, tip: "Negrita" }, { icon: Italic, tip: "Cursiva" }, { icon: List, tip: "Viñetas" }, { icon: AlignLeft, tip: "Alinear" }].map(({ icon: Icon, tip }) => (
              <button key={tip} title={tip} className="p-1.5 text-brand-gray hover:text-brand-navy hover:bg-gray-100 rounded transition-colors">
                <Icon className="w-4 h-4" />
              </button>
            ))}
            <div className="w-px h-4 bg-gray-200 mx-1" />
            <button className="p-1.5 text-brand-gray hover:text-brand-navy hover:bg-gray-100 rounded transition-colors" title="Separador">
              <Minus className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5">
            <textarea rows={8} value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red resize-none leading-relaxed" />
            <p className="text-[10px] text-brand-gray mt-1">{description.length} caracteres · Mín. 100 recomendado</p>
          </div>
        </div>

        {/* Requisitos */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-brand-bg border-b border-gray-100 px-5 py-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-brand-red" />
            <h2 className="font-bold text-brand-navy text-sm">Requisitos</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-brand-navy mb-1.5">Nivel educativo mínimo</label>
                <div className="relative">
                  <select className="w-full appearance-none px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red">
                    <option>Secundaria completa</option><option>Técnico</option><option>Universitario</option><option>Posgrado</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-navy mb-1.5">Experiencia mínima</label>
                <div className="relative">
                  <select className="w-full appearance-none px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red">
                    <option>Sin experiencia</option><option>6 meses - 1 año</option><option>1 - 2 años</option>
                    <option>2 - 5 años</option><option>5+ años</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-navy mb-1.5">Habilidades / Tags (separadas por coma)</label>
              <input type="text" defaultValue="Ventas, Telecomunicaciones, Atención al cliente, Comunicación efectiva"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red" />
            </div>
          </div>
        </div>

        {/* Botones finales */}
        <div className="flex items-center justify-end gap-3 pb-4">
          <Link to="/reclutador/dashboard"
            className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-brand-gray rounded-lg text-sm font-medium transition-colors">
            <X className="w-4 h-4" /> Cancelar
          </Link>
          <button className="flex items-center gap-2 px-6 py-2.5 border border-brand-red text-brand-red rounded-lg text-sm font-medium hover:bg-brand-red/5 transition-colors">
            Guardar borrador
          </button>
          <button onClick={() => setPublished(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-red hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors">
            <Save className="w-4 h-4" /> Publicar Oferta
          </button>
        </div>
      </div>
    </div>
  );
}