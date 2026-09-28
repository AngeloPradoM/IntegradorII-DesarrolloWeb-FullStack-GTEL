import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { saveProfile } from "../../services/api";
import "./perfil.css";
import UnsavedChangesDialog from "../../components/ui/UnsavedChangesDialog";

const regions = ['Amazonas','Ancash','Apurímac','Arequipa','Ayacucho','Cajamarca','Callao','Cusco','Huancavelica','Huánuco','Ica','Junín','La Libertad','Lambayeque','Lima','Loreto','Madre de Dios','Moquegua','Pasco','Piura','Puno','San Martín','Tacna','Tumbes','Ucayali'];
const fields = user => Object.fromEntries(['nombres','apellidos','email','telefono','ubicacion','localidad','correoContacto','foto'].map(key => [key, key === 'telefono' ? (user[key] || '').replace(/^\+51/, '') : user[key] || '']));

export default function ProfileEditor() {
  const { user, updateProfile } = useAuth();
  const [saved, setSaved] = useState(() => fields(user));
  const [form, setForm] = useState(saved);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
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
  const input = (name, label, props = {}) => <label>{label}<input name={name} value={form[name]} onChange={change} {...props} /></label>;
  return <><UnsavedChangesDialog dirty={dirty || photoLoading} /><div className="profile-editor"><div className="page">
    <nav className="breadcrumb" aria-label="Ruta"><Link to="/">Inicio</Link><span>/</span><span>Mi perfil</span></nav>
    <div className="page-heading"><div><p className="eyebrow">MI CUENTA</p><h1>Un perfil que habla de ti</h1><p>Mantén tus datos actualizados para que podamos contactarte.</p></div><span className="account-badge">Perfil de {user.rol === 'RECLUTADOR' ? 'reclutador' : 'candidato'}</span></div>
    <div className="layout"><aside><div className="identity"><div className="portrait">{avatar}</div><h2>{form.nombres} {form.apellidos}</h2><p>{form.email}</p><span className="member">GTEL Talento</span></div><nav className="section-nav" aria-label="Secciones del perfil"><a href="#personal">01 <span>Información personal</span></a><a href="#contact">02 <span>Datos de contacto</span></a><a href="#location">03 <span>Localidad</span></a></nav><p className="aside-note">Tus datos de contacto nos permiten acompañarte durante tus procesos de selección.</p></aside>
    <form onSubmit={submit}><fieldset disabled={busy} className="min-w-0 border-0 p-0">
      <section className="card" id="personal"><div className="section-title"><span className="section-number">01</span><div><h2>Información personal</h2><p>Así te identificarás en la plataforma.</p></div></div>
        <div className="photo-row"><div className="photo-preview">{avatar}</div><div><h3>Foto de perfil</h3><div className="photo-actions"><button type="button" className="secondary" onClick={() => file.current.click()}>Cambiar foto</button>{form.foto && <button type="button" className="text-button" onClick={() => { photoVersion.current++; setPhotoLoading(false); setForm(previous => ({ ...previous, foto:'' })); file.current.value = ''; }}>Eliminar</button>}</div><p className="hint">JPG, PNG o WebP. Máximo 2 MB.</p><input ref={file} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} /></div></div>
        <div className="grid">{input('nombres','Nombres *',{required:true,minLength:2,autoComplete:'given-name'})}{input('apellidos','Apellidos *',{required:true,minLength:2,autoComplete:'family-name'})}</div>
      </section>
      <section className="card" id="contact"><div className="section-title"><span className="section-number">02</span><div><h2>Datos de contacto</h2><p>Elige dónde quieres recibir nuestras comunicaciones.</p></div></div>{input('email','Correo principal *',{type:'email',required:true,autoComplete:'email'})}<div className="grid">{input('correoContacto','Correo adicional (opcional)',{type:'email',placeholder:'otro@correo.com'})}<label>Teléfono / WhatsApp *<div className="phone"><span>+51</span><input name="telefono" type="tel" inputMode="numeric" autoComplete="tel-national" required pattern="[0-9]{9}" maxLength={9} value={form.telefono} onChange={change} /></div></label></div></section>
      <section className="card" id="location"><div className="section-title"><span className="section-number">03</span><div><h2>Localidad</h2><p>Ayúdanos a conocer dónde te encuentras.</p></div></div><div className="grid"><label>Departamento *<select required name="ubicacion" value={form.ubicacion} onChange={change}><option value="">Selecciona un departamento</option>{regions.map(region => <option key={region}>{region}</option>)}</select></label>{input('localidad','Ciudad o distrito (opcional)',{maxLength:100,autoComplete:'address-level2',placeholder:'Ej. Miraflores'})}</div></section>
      <div className="save-bar"><p role="status">{message || (photoLoading ? 'Cargando foto…' : dirty ? 'Tienes cambios sin guardar.' : 'Revisa tus datos antes de guardar.')}</p><div><button type="button" className="secondary" onClick={() => { photoVersion.current++; setPhotoLoading(false); setForm(saved); setMessage('Cambios descartados.'); file.current.value = ''; }}>Descartar cambios</button><button type="submit" className="primary" disabled={busy || photoLoading}>{busy ? 'Guardando…' : 'Guardar cambios'}</button></div></div>
    </fieldset></form></div>
  </div></div></>;
}
