import { publishJob as saveJob } from "../../services/api";
import { validateJob } from "../../utils/formValidation";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bold, Italic, List, AlignLeft, Minus, Save, X, ChevronDown, FileText, DollarSign, MapPin, Clock, Users, Tag, AlertCircle } from "lucide-react";
export default function PublishJob() {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Full-Time");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [published, setPublished] = useState(false);
  const [details, setDetails] = useState({ department:'', vacancies:'', modality:'Presencial', deadline:'', education:'Secundaria completa', experience:'Sin experiencia', tags:'' });
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState('');
  const updateDetail = event => setDetails(previous => ({ ...previous, [event.target.name]:event.target.value }));
  const fieldError = name => errors[name] && <p role="alert" className="mt-1 text-xs text-red-600">{errors[name]}</p>;
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const publishJob = async () => {
    if (busy.current) return;
    const data = {title,type,location,description,salaryMin,salaryMax,...details};
    const next = validateJob(data);
    setErrors(next); setSaveError('');
    if (Object.keys(next).length) return;
    busy.current = true; setSaving(true);
    try { await saveJob({ ...data, tags:details.tags.split(',').map(tag=>tag.trim()).filter(Boolean) }); setPublished(true); }
    catch (error) { setSaveError(error.message); }
    finally { busy.current = false; setSaving(false); }
  };
  if (published) {
    return <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 max-w-md text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-[#1E293B] mb-2">¡Oferta publicada!</h2>
          <p className="text-sm text-[#475569] mb-5">La solicitud de publicación fue confirmada por el servicio.</p>
          <div className="flex gap-3">
            <button onClick={() => setPublished(false)} className="flex-1 border border-gray-200 text-[#475569] py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">
              Publicar otra
            </button>
            <Link to="/reclutador/postulantes" className="flex-1 bg-[#D32F2F] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#B71C1C] text-center">
              Ver candidatos
            </Link>
          </div>
        </div>
      </div>;
  }
  return <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#1E293B]">Publicar Nueva Oferta</h1>
          <p className="text-sm text-[#475569]">Completa los campos para crear una nueva vacante</p>
        </div>
        <div className="flex gap-3">
          <Link to="/reclutador/dashboard" className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-[#475569] rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            <X className="w-4 h-4" />
            Cancelar
          </Link>
          <button disabled={saving} onClick={publishJob} className="flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors">
            <Save className="w-4 h-4" />
            {saving ? "Publicando…" : "Publicar Oferta"}
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {saveError && <p role="alert" className="mb-4 text-sm text-red-600">{saveError}</p>}
        {/* Block 1: Información básica */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-[#F8FAFC] border-b border-gray-100 px-5 py-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#D32F2F]" />
            <h2 className="font-bold text-[#1E293B] text-sm">Información Básica</h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Título del puesto *</label>
              <input type="text" placeholder="Ej: Agente de Ventas Telefónicas Senior" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]" />{fieldError('title')}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-[#1E293B] mb-1.5">
                  <Users className="w-3.5 h-3.5 text-gray-400" />
                  Departamento / Área *
                </label>
                <div className="relative">
                  <select name="department" value={details.department} onChange={updateDetail} className="w-full appearance-none px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]">
                    <option value="">Selecciona un área</option><option>Ventas</option>
                    <option>Soporte Técnico</option>
                    <option>Supervisión</option>
                    <option>Recursos Humanos</option>
                    <option>Calidad</option>
                    <option>Operaciones</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>{fieldError('department')}
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-[#1E293B] mb-1.5">
                  <Tag className="w-3.5 h-3.5 text-gray-400" />
                  Número de vacantes
                </label>
                <input type="number" min="1" name="vacancies" value={details.vacancies} onChange={updateDetail} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]" />{fieldError('vacancies')}
              </div>
            </div>
          </div>
        </div>

        {/* Block 2: Condiciones */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-[#F8FAFC] border-b border-gray-100 px-5 py-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#D32F2F]" />
            <h2 className="font-bold text-[#1E293B] text-sm">Condiciones Laborales</h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-[#1E293B] mb-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                  Sueldo mínimo (S/)
                </label>
                <input type="number" value={salaryMin} onChange={e => setSalaryMin(e.target.value)} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]" />{fieldError('salaryMin')}
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-[#1E293B] mb-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                  Sueldo máximo (S/)
                </label>
                <input type="number" value={salaryMax} onChange={e => setSalaryMax(e.target.value)} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]" />{fieldError('salaryMax')}
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-[#1E293B] mb-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  Tipo de jornada *
                </label>
                <div className="relative">
                  <select value={type} onChange={e => setType(e.target.value)} className="w-full appearance-none px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]"><option value="Full-Time">Full-Time (8 horas)</option>
                    <option value="Part-Time">Part-Time (4 horas)</option>
                    <option>Por turnos</option>
                    <option>Freelance</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-[#1E293B] mb-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  Modalidad
                </label>
                <div className="relative">
                  <select name="modality" value={details.modality} onChange={updateDetail} className="w-full appearance-none px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]">
                    <option>Presencial</option>
                    <option>Remoto</option>
                    <option>Híbrido</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-[#1E293B] mb-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  Sede / Ubicación
                </label>
                <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]" />{fieldError('location')}
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Fecha límite de postulación</label>
                <input type="date" name="deadline" value={details.deadline} onChange={updateDetail} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]" />
              </div>
            </div>
          </div>
        </div>

        {/* Block 3: Descripción con WYSIWYG */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-[#F8FAFC] border-b border-gray-100 px-5 py-3 flex items-center gap-2">
            <AlignLeft className="w-4 h-4 text-[#D32F2F]" />
            <h2 className="font-bold text-[#1E293B] text-sm">Descripción del Puesto</h2>
          </div>

          {/* Toolbar */}
          <div className="border-b border-gray-100 px-5 py-2 flex items-center gap-1 flex-wrap">
            {[{
            icon: Bold,
            tip: "Negrita"
          }, {
            icon: Italic,
            tip: "Cursiva"
          }, {
            icon: List,
            tip: "Viñetas"
          }, {
            icon: AlignLeft,
            tip: "Alinear"
          }].map(({
            icon: Icon,
            tip
          }) => <button disabled key={tip} title={`${tip}: formato pendiente de implementación`} className="p-1.5 text-[#475569] hover:text-[#1E293B] hover:bg-gray-100 rounded transition-colors">
                <Icon className="w-4 h-4" />
              </button>)}
            <div className="w-px h-4 bg-gray-200 mx-1" />
            <button disabled className="p-1.5 text-[#475569] hover:text-[#1E293B] hover:bg-gray-100 rounded transition-colors" title="Separador">
              <Minus className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5">
            <textarea rows={8} value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] resize-none leading-relaxed" />{fieldError('description')}
            <p className="text-[10px] text-[#475569] mt-1">{description.length} caracteres · Mín. 100 recomendado</p>
          </div>
        </div>

        {/* Block 4: Requisitos */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-[#F8FAFC] border-b border-gray-100 px-5 py-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#D32F2F]" />
            <h2 className="font-bold text-[#1E293B] text-sm">Requisitos</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Nivel educativo mínimo</label>
                <div className="relative">
                  <select name="education" value={details.education} onChange={updateDetail} className="w-full appearance-none px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]">
                    <option>Secundaria completa</option>
                    <option>Técnico</option>
                    <option>Universitario</option>
                    <option>Posgrado</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Experiencia mínima</label>
                <div className="relative">
                  <select name="experience" value={details.experience} onChange={updateDetail} className="w-full appearance-none px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]">
                    <option>Sin experiencia</option>
                    <option>6 meses - 1 año</option>
                    <option>1 - 2 años</option>
                    <option>2 - 5 años</option>
                    <option>5+ años</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">Habilidades / Tags (separadas por coma)</label>
              <input type="text" name="tags" value={details.tags} onChange={updateDetail} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]" />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pb-4">
          <Link to="/reclutador/dashboard" className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#475569] rounded-lg text-sm font-medium transition-colors">
            <X className="w-4 h-4" />
            Cancelar
          </Link>
          <button disabled title="Borradores pendientes de integración" className="flex items-center gap-2 px-6 py-2.5 border border-[#D32F2F] text-[#D32F2F] rounded-lg text-sm font-medium hover:bg-[#D32F2F]/5 transition-colors">
            Guardar borrador
          </button>
          <button disabled={saving} onClick={publishJob} className="flex items-center gap-2 px-6 py-2.5 bg-[#D32F2F] hover:bg-[#B71C1C] text-white rounded-lg text-sm font-semibold transition-colors">
            <Save className="w-4 h-4" />
            Publicar Oferta
          </button>
        </div>
      </div>
    </div>;
}
