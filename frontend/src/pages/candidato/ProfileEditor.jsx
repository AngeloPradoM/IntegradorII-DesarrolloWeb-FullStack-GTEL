import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { saveProfile, exportCandidateArcoData, anonymizeCandidateArcoAccount } from "../../services/api";
import { Download, Trash2, ShieldCheck, AlertTriangle } from "lucide-react";
import "./perfil.css";
import UnsavedChangesDialog from "../../components/ui/UnsavedChangesDialog";

const regions = ['Amazonas','Ancash','Apurímac','Arequipa','Ayacucho','Cajamarca','Callao','Cusco','Huancavelica','Huánuco','Ica','Junín','La Libertad','Lambayeque','Lima','Loreto','Madre de Dios','Moquegua','Pasco','Piura','Puno','San Martín','Tacna','Tumbes','Ucayali'];
const fields = user => Object.fromEntries(['nombres','apellidos','email','telefono','ubicacion','localidad','correoContacto','foto'].map(key => [key, key === 'telefono' ? (user[key] || '').replace(/^\+51/, '') : user[key] || '']));

export default function ProfileEditor() {
  const { user, updateProfile, logout } = useAuth();
  const [saved, setSaved] = useState(() => fields(user));
  const [form, setForm] = useState(saved);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showAnonymizeModal, setShowAnonymizeModal] = useState(false);
  const [anonymizeConfirm, setAnonymizeConfirm] = useState(false);
  const [anonymizeMotivo, setAnonymizeMotivo] = useState('');
  const [anonymizing, setAnonymizing] = useState(false);
  const [arcoMessage, setArcoMessage] = useState('');
  const [arcoError, setArcoError] = useState('');
  const photoVersion = useRef(0);
  const file = useRef(null);
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  useEffect(() => {
    const warn = event => { if (dirty || photoLoading) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, photoLoading]);
  const change = event => {
    const { name, value } = event.target;
    setForm(previous => ({ ...previous, [name]: name === 'telefono' ? value.replace(/\D/g,'').slice(0,9) : value }));
    setMessage('');
  };
  const initials = `${form.nombres.charAt(0)}${form.apellidos.charAt(0)}`.toUpperCase() || 'GT';
  const avatar = form.foto ? <img src={form.foto} alt="Foto de perfil" /> : <span>{initials}</span>;
  const upload = event => {
    const imageFile = event.target.files[0];
    const version = ++photoVersion.current;
    setPhotoLoading(false);
    if (!imageFile) return;
    if (!['image/jpeg','image/png','image/webp'].includes(imageFile.type) || imageFile.size > 2 * 1024 * 1024) { setMessage('Selecciona una imagen JPG, PNG o WebP de hasta 2 MB.'); return; }
    setPhotoLoading(true);
    const reader = new FileReader();
    const failed = () => { if (version === photoVersion.current) { setMessage('No se pudo leer la imagen.'); setPhotoLoading(false); } };
    reader.onerror = failed;
    reader.onload = () => {
      const image = new Image();
      image.onerror = failed;
      image.onload = () => {
        if (version !== photoVersion.current) return;
        setForm(previous => ({ ...previous, foto: reader.result }));
        setPhotoLoading(false); setMessage('');
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(imageFile);
  };
  const submit = async event => {
    event.preventDefault();
    if (busy || photoLoading) return;
    if (![form.nombres, form.apellidos].every(value => /^[\p{L}\p{M} '-]{2,}$/u.test(value.trim()))) { setMessage('Ingresa nombres y apellidos válidos de al menos dos caracteres.'); return; }
    if (form.correoContacto && form.correoContacto.trim().toLowerCase() === form.email.trim().toLowerCase()) { setMessage('El correo adicional debe ser distinto al principal.'); return; }
    setBusy(true); setMessage('');
    try {
      const result = await saveProfile(user, { ...form, nombres:form.nombres.trim(), apellidos:form.apellidos.trim(), email:form.email.trim().toLowerCase(), correoContacto:form.correoContacto.trim().toLowerCase(), telefono:`+51${form.telefono}` });
      updateProfile(result); setSaved(fields(result)); setForm(fields(result)); setMessage('Cambios guardados. Tu perfil está actualizado.');
    } catch (error) { setMessage(error.message || 'No se pudo guardar el perfil.'); }
    finally { setBusy(false); }
  };

  const handleExportData = async () => {
    setExporting(true);
    setArcoMessage('');
    setArcoError('');
    try {
      const data = await exportCandidateArcoData(user);
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expediente-gtel-talento-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setArcoMessage('Expediente exportado exitosamente conforme a la Ley N° 29733.');
    } catch (err) {
      setArcoError(err.message || 'Error al exportar los datos.');
    } finally {
      setExporting(false);
    }
  };

  const handleAnonymize = async () => {
    if (!anonymizeConfirm || anonymizing) return;
    setAnonymizing(true);
    setArcoError('');
    try {
      const res = await anonymizeCandidateArcoAccount(true, anonymizeMotivo, user);
      setShowAnonymizeModal(false);
      setArcoMessage(res.mensaje || 'Tu cuenta ha sido anonimizada permanentemente.');
      setTimeout(() => {
        logout();
        window.location.href = '/';
      }, 2500);
    } catch (err) {
      setArcoError(err.message || 'No se pudo procesar la anonimización.');
      setAnonymizing(false);
    }
  };

  const input = (name, label, props = {}) => <label>{label}<input name={name} value={form[name]} onChange={change} {...props} /></label>;
  return <><UnsavedChangesDialog dirty={dirty || photoLoading} /><div className="profile-editor"><div className="page">
    <nav className="breadcrumb" aria-label="Ruta"><Link to="/">Inicio</Link><span>/</span><span>Mi perfil</span></nav>
    <div className="page-heading"><div><p className="eyebrow">MI CUENTA</p><h1>Un perfil que habla de ti</h1><p>Mantén tus datos actualizados para que podamos contactarte.</p></div><span className="account-badge">Perfil de {user.rol === 'RECLUTADOR' ? 'reclutador' : 'candidato'}</span></div>
    <div className="layout"><aside><div className="identity"><div className="portrait">{avatar}</div><h2>{form.nombres} {form.apellidos}</h2><p>{form.email}</p><span className="member">GTEL Talento</span></div><nav className="section-nav" aria-label="Secciones del perfil"><a href="#personal">01 <span>Información personal</span></a><a href="#contact">02 <span>Datos de contacto</span></a><a href="#location">03 <span>Localidad</span></a><a href="#privacy">04 <span>Privacidad (Ley 29733)</span></a></nav><p className="aside-note">Tus datos de contacto nos permiten acompañarte durante tus procesos de selección.</p></aside>
    <form onSubmit={submit}><fieldset disabled={busy} className="min-w-0 border-0 p-0">
      <section className="card" id="personal"><div className="section-title"><span className="section-number">01</span><div><h2>Información personal</h2><p>Así te identificarás en la plataforma.</p></div></div>
        <div className="photo-row"><div className="photo-preview">{avatar}</div><div><h3>Foto de perfil</h3><div className="photo-actions"><button type="button" className="secondary" onClick={() => file.current.click()}>Cambiar foto</button>{form.foto && <button type="button" className="text-button" onClick={() => { photoVersion.current++; setPhotoLoading(false); setForm(previous => ({ ...previous, foto:'' })); file.current.value = ''; }}>Eliminar</button>}</div><p className="hint">JPG, PNG o WebP. Máximo 2 MB.</p><input ref={file} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} /></div></div>
        <div className="grid">{input('nombres','Nombres *',{required:true,minLength:2,autoComplete:'given-name'})}{input('apellidos','Apellidos *',{required:true,minLength:2,autoComplete:'family-name'})}</div>
      </section>
      <section className="card" id="contact"><div className="section-title"><span className="section-number">02</span><div><h2>Datos de contacto</h2><p>Elige dónde quieres recibir nuestras comunicaciones.</p></div></div>{input('email','Correo principal *',{type:'email',required:true,autoComplete:'email'})}<div className="grid">{input('correoContacto','Correo adicional (opcional)',{type:'email',placeholder:'otro@correo.com'})}<label>Teléfono / WhatsApp *<div className="phone"><span>+51</span><input name="telefono" type="tel" inputMode="numeric" autoComplete="tel-national" required pattern="[0-9]{9}" maxLength={9} value={form.telefono} onChange={change} /></div></label></div></section>
      <section className="card" id="location"><div className="section-title"><span className="section-number">03</span><div><h2>Localidad</h2><p>Ayúdanos a conocer dónde te encuentras.</p></div></div><div className="grid"><label>Departamento *<select required name="ubicacion" value={form.ubicacion} onChange={change}><option value="">Selecciona un departamento</option>{regions.map(region => <option key={region}>{region}</option>)}</select></label>{input('localidad','Ciudad o distrito (opcional)',{maxLength:100,autoComplete:'address-level2',placeholder:'Ej. Miraflores'})}</div></section>
      
      <section className="card" id="privacy">
        <div className="section-title">
          <span className="section-number">04</span>
          <div>
            <h2>Protección de Datos Personales (Ley N° 29733 - Perú)</h2>
            <p>Ejerce tus derechos ARCO (Acceso, Rectificación, Cancelación y Oposición) sobre tu expediente laboral.</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 mt-2">
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
              <div className="text-sm text-slate-700">
                <p className="font-semibold text-slate-900 mb-0.5">Tus datos están protegidos bajo normativa peruana</p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  GTEL TALENTO S.A.C. garantiza el tratamiento seguro de tus datos para fines exclusivos de convocatorias laborales y evaluación técnica según la Ley N° 29733 y el D.S. 003-2013-JUS.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Download className="h-4 w-4 text-brand-red" />
                  Derecho de Acceso y Portabilidad
                </h4>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Descarga una copia completa y estructurada en formato JSON de tu expediente, historial de postulaciones, evaluaciones y consentimiento registrado.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportData}
                disabled={exporting}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:opacity-50"
              >
                {exporting ? 'Generando legajo...' : 'Exportar mi expediente (JSON)'}
              </button>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-semibold text-red-900 flex items-center gap-2">
                  <Trash2 className="h-4 w-4 text-red-600" />
                  Derecho de Cancelación / Supresión
                </h4>
                <p className="text-xs text-red-700 mt-1.5 leading-relaxed">
                  Solicita la anonimización definitiva de tu cuenta y la eliminación física de tus currículums de los servidores de GTEL.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAnonymizeModal(true)}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700"
              >
                Solicitar supresión / baja
              </button>
            </div>
          </div>

          {arcoMessage && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
              {arcoMessage}
            </div>
          )}
          {arcoError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {arcoError}
            </div>
          )}
        </div>
      </section>

      <div className="save-bar"><p role="status">{message || (photoLoading ? 'Cargando foto…' : dirty ? 'Tienes cambios sin guardar.' : 'Revisa tus datos antes de guardar.')}</p><div><button type="button" className="secondary" onClick={() => { photoVersion.current++; setPhotoLoading(false); setForm(saved); setMessage('Cambios descartados.'); file.current.value = ''; }}>Descartar cambios</button><button type="submit" className="primary" disabled={busy || photoLoading}>{busy ? 'Guardando…' : 'Guardar cambios'}</button></div></div>
    </fieldset></form></div>
  </div></div>
  {showAnonymizeModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center gap-3 text-red-600 mb-3">
          <AlertTriangle className="h-6 w-6 shrink-0" />
          <h3 className="text-lg font-bold text-slate-900">¿Confirmar supresión de datos?</h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed mb-4">
          Esta acción es <strong>irreversible</strong> conforme al Art. 20 de la Ley N° 29733. Se anonimizarán tus datos de contacto, se cancelarán tus postulaciones en curso y se eliminarán físicamente todos tus archivos de currículum (CV) del servidor.
        </p>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Motivo (opcional)
          </label>
          <textarea
            rows={2}
            value={anonymizeMotivo}
            onChange={e => setAnonymizeMotivo(e.target.value)}
            placeholder="Ej: Ya encontré trabajo / No deseo participar más"
            className="w-full text-xs rounded-lg border border-slate-200 p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-200"
          />
        </div>

        <label className="flex items-start gap-2 text-xs text-slate-700 mb-5 cursor-pointer">
          <input
            type="checkbox"
            checked={anonymizeConfirm}
            onChange={e => setAnonymizeConfirm(e.target.checked)}
            className="mt-0.5 rounded border-slate-300 text-red-600 focus:ring-red-500"
          />
          <span>He leído la advertencia y solicito expresamente la supresión y anonimización de mis datos personales.</span>
        </label>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => { setShowAnonymizeModal(false); setAnonymizeConfirm(false); }}
            disabled={anonymizing}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleAnonymize}
            disabled={!anonymizeConfirm || anonymizing}
            className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
          >
            {anonymizing ? 'Procesando baja...' : 'Confirmar y dar de baja'}
          </button>
        </div>
      </div>
    </div>
  )}</>;
}
