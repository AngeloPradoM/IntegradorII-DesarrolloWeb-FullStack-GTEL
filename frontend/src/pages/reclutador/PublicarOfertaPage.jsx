import { publishJob as saveJob, getRecruiterDepartments } from "../../services/api";
import { validateJob } from "../../utils/formValidation";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Bold, Italic, List, AlignLeft, Minus, Save, X, ChevronDown, FileText, DollarSign, MapPin, Clock, Users, Tag, AlertCircle } from "lucide-react";
import { DatePicker } from "../../components/ui/DateTimePickers";
const localISODate = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const cardClassName = "overflow-hidden rounded-xl border border-app-border bg-app-surface shadow-sm";
const cardHeaderClassName = "recruiter-section-header flex items-center gap-2 border-b border-app-border px-5 py-3";
const cardTitleClassName = "text-sm font-bold text-app-primary";
const labelClassName = "mb-1.5 block text-xs font-semibold text-app-primary";
const iconLabelClassName = "mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-app-primary";
const labelIconClassName = "h-3.5 w-3.5 text-app-secondary";
const fieldClassName = "w-full rounded-lg border border-app-border-strong bg-app-bg px-3.5 py-2.5 text-sm text-app-primary placeholder:text-app-secondary focus:border-app-action focus:outline-none focus:ring-2 focus:ring-app-action/20";
const selectClassName = `${fieldClassName} appearance-none`;

export default function PublishJob() {
  const [searchParams] = useSearchParams();
  const [title, setTitle] = useState(searchParams.get("title") || "");
  const [type, setType] = useState("Full-Time");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [published, setPublished] = useState(false);
  const [departments, setDepartments] = useState([
    { id: 1, name: "Ventas y Comercial" },
    { id: 2, name: "Atención al Cliente" },
    { id: 3, name: "Soporte Técnico e IT" },
    { id: 4, name: "Recursos Humanos" },
    { id: 5, name: "Operaciones Call Center" }
  ]);
  const [details, setDetails] = useState({
    department: searchParams.get("department") || '',
    vacancies: searchParams.get("vacancies") || '',
    modality: 'Presencial',
    deadline: '',
    education: 'Secundaria completa',
    experience: 'Sin experiencia',
    tags: ''
  });
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    getRecruiterDepartments()
      .then(list => {
        if (Array.isArray(list) && list.length > 0) {
          setDepartments(list);
        }
      })
      .catch(() => {});
  }, []);

  const updateDetail = event => setDetails(previous => ({ ...previous, [event.target.name]:event.target.value }));
  const fieldError = name => errors[name] && <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">{errors[name]}</p>;
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
        <div className="max-w-md rounded-2xl border border-app-border bg-app-surface p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/60">
            <FileText className="h-7 w-7 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-app-primary">¡Oferta publicada!</h2>
          <p className="mb-5 text-sm text-app-secondary">La solicitud de publicación fue confirmada por el servicio.</p>
          <div className="flex gap-3">
            <button onClick={() => setPublished(false)} className="flex-1 rounded-lg border border-app-border py-2.5 text-sm font-medium text-app-secondary transition-colors hover:bg-app-muted hover:text-app-primary">
              Publicar otra
            </button>
            <Link to="/reclutador/postulantes" className="flex-1 rounded-lg bg-app-action py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-app-action-hover">
              Ver candidatos
            </Link>
          </div>
        </div>
      </div>;
  }
  return <div className="recruiter-page max-w-4xl p-4 text-app-primary sm:p-6">
      {/* Header */}
      <div className="recruiter-page-header">
        <div>
          <h1 className="text-xl font-bold text-app-primary">Publicar Nueva Oferta</h1>
          <p className="text-sm text-app-secondary">Completa los campos para crear una nueva vacante</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/reclutador/dashboard" className="recruiter-action-secondary">
            <X className="w-4 h-4" />
            Cancelar
          </Link>
          <button disabled={saving} onClick={publishJob} className="recruiter-action-primary">
            <Save className="w-4 h-4" />
            {saving ? "Publicando…" : "Publicar Oferta"}
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {saveError && <p role="alert" className="mb-4 text-sm text-red-600 dark:text-red-400">{saveError}</p>}
        {/* Block 1: Información básica */}
        <div className={cardClassName}>
          <div className={cardHeaderClassName}>
            <FileText className="h-4 w-4 text-app-accent" />
            <h2 className={cardTitleClassName}>Información Básica</h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className={labelClassName}>Título del puesto *</label>
              <input type="text" placeholder="Ej: Agente de Ventas Telefónicas Senior" value={title} onChange={e => setTitle(e.target.value)} className={fieldClassName} />{fieldError('title')}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={iconLabelClassName}>
                  <Users className={labelIconClassName} />
                  Departamento / Área *
                </label>
                <div className="relative">
                  <select name="department" value={details.department} onChange={updateDetail} className={selectClassName}>
                    <option value="">Selecciona un área</option>
                    {departments.map(d => (
                      <option key={d.id || d.name} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-secondary" />
                </div>{fieldError('department')}
              </div>
              <div>
                <label className={iconLabelClassName}>
                  <Tag className={labelIconClassName} />
                  Número de vacantes
                </label>
                <input type="number" min="1" name="vacancies" value={details.vacancies} onChange={updateDetail} className={fieldClassName} />{fieldError('vacancies')}
              </div>
            </div>
          </div>
        </div>

        {/* Block 2: Condiciones */}
        <div className={cardClassName}>
          <div className={cardHeaderClassName}>
            <DollarSign className="h-4 w-4 text-app-accent" />
            <h2 className={cardTitleClassName}>Condiciones Laborales</h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={iconLabelClassName}>
                  <DollarSign className={labelIconClassName} />
                  Sueldo mínimo (S/)
                </label>
                <input type="number" value={salaryMin} onChange={e => setSalaryMin(e.target.value)} className={fieldClassName} />{fieldError('salaryMin')}
              </div>
              <div>
                <label className={iconLabelClassName}>
                  <DollarSign className={labelIconClassName} />
                  Sueldo máximo (S/)
                </label>
                <input type="number" value={salaryMax} onChange={e => setSalaryMax(e.target.value)} className={fieldClassName} />{fieldError('salaryMax')}
              </div>
              <div>
                <label className={iconLabelClassName}>
                  <Clock className={labelIconClassName} />
                  Tipo de jornada *
                </label>
                <div className="relative">
                  <select value={type} onChange={e => setType(e.target.value)} className={selectClassName}><option value="Full-Time">Full-Time (8 horas)</option>
                    <option value="Part-Time">Part-Time (4 horas)</option>
                    <option>Por turnos</option>
                    <option>Freelance</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-secondary" />
                </div>
              </div>
              <div>
                <label className={iconLabelClassName}>
                  <MapPin className={labelIconClassName} />
                  Modalidad
                </label>
                <div className="relative">
                  <select name="modality" value={details.modality} onChange={updateDetail} className={selectClassName}>
                    <option>Presencial</option>
                    <option>Remoto</option>
                    <option>Híbrido</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-secondary" />
                </div>
              </div>
              <div>
                <label className={iconLabelClassName}>
                  <MapPin className={labelIconClassName} />
                  Sede / Ubicación
                </label>
                <input type="text" value={location} onChange={e => setLocation(e.target.value)} className={fieldClassName} />{fieldError('location')}
              </div>
              <div>
                <DatePicker
                  label="Fecha límite de postulación"
                  name="deadline"
                  value={details.deadline}
                  min={localISODate(new Date())}
                  disabled={saving}
                  onChange={deadline => setDetails(previous => ({ ...previous, deadline }))}
                />
                {fieldError('deadline')}
              </div>
            </div>
          </div>
        </div>

        {/* Block 3: Descripción con WYSIWYG */}
        <div className={cardClassName}>
          <div className={cardHeaderClassName}>
            <AlignLeft className="h-4 w-4 text-app-accent" />
            <h2 className={cardTitleClassName}>Descripción del Puesto</h2>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-1 border-b border-app-border px-5 py-2">
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
          }) => <button disabled key={tip} title={`${tip}: formato pendiente de implementación`} className="rounded p-1.5 text-app-secondary transition-colors hover:bg-app-muted hover:text-app-primary">
                <Icon className="w-4 h-4" />
              </button>)}
            <div className="mx-1 h-4 w-px bg-app-border" />
            <button disabled className="rounded p-1.5 text-app-secondary transition-colors hover:bg-app-muted hover:text-app-primary" title="Separador">
              <Minus className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5">
            <textarea rows={8} value={description} onChange={e => setDescription(e.target.value)} className={`${fieldClassName} resize-none leading-relaxed`} />{fieldError('description')}
            <p className="mt-1 text-[10px] text-app-secondary">{description.length} caracteres · Mín. 100 recomendado</p>
          </div>
        </div>

        {/* Block 4: Requisitos */}
        <div className={cardClassName}>
          <div className={cardHeaderClassName}>
            <AlertCircle className="h-4 w-4 text-app-accent" />
            <h2 className={cardTitleClassName}>Requisitos</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClassName}>Nivel educativo mínimo</label>
                <div className="relative">
                  <select name="education" value={details.education} onChange={updateDetail} className={selectClassName}>
                    <option>Secundaria completa</option>
                    <option>Técnico</option>
                    <option>Universitario</option>
                    <option>Posgrado</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-secondary" />
                </div>
              </div>
              <div>
                <label className={labelClassName}>Experiencia mínima</label>
                <div className="relative">
                  <select name="experience" value={details.experience} onChange={updateDetail} className={selectClassName}>
                    <option>Sin experiencia</option>
                    <option>6 meses - 1 año</option>
                    <option>1 - 2 años</option>
                    <option>2 - 5 años</option>
                    <option>5+ años</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-secondary" />
                </div>
              </div>
            </div>
            <div>
              <label className={labelClassName}>Habilidades / Tags (separadas por coma)</label>
              <input type="text" name="tags" value={details.tags} onChange={updateDetail} className={fieldClassName} />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-end gap-3 pb-4">
          <Link to="/reclutador/dashboard" className="flex items-center gap-2 rounded-lg bg-app-muted px-6 py-2.5 text-sm font-medium text-app-secondary transition-colors hover:text-app-primary">
            <X className="w-4 h-4" />
            Cancelar
          </Link>
          <button disabled title="Borradores pendientes de integración" className="flex items-center gap-2 rounded-lg border border-app-action px-6 py-2.5 text-sm font-medium text-app-accent transition-colors hover:bg-app-danger-soft">
            Guardar borrador
          </button>
          <button disabled={saving} onClick={publishJob} className="flex items-center gap-2 rounded-lg bg-app-action px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-app-action-hover">
            <Save className="w-4 h-4" />
            Publicar Oferta
          </button>
        </div>
      </div>
    </div>;
}
