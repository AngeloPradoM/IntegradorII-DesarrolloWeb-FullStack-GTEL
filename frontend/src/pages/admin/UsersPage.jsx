import './admin-workspace.css';
import { Search, Plus, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { listUsers, saveUser, deleteUser } from '../../services/adminService';

const empty = { email: '', password: '', rol: 'CANDIDATO', estado: 'activo', nombres: '', apellidos: '', telefono: '' };
export default function UsersPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editor, setEditor] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();let active=true;
    // Cancel the timer and the previous request when typing, paging or leaving.
    const timer=setTimeout(()=>{
      listUsers(query.trim(), page, controller.signal).then(result=>{
        if(active){setData(result);setError('');}
      }).catch(e=>{if(active&&e.name!=='AbortError')setError(e.message);});
    },300);
    return()=>{active=false;clearTimeout(timer);controller.abort();};
  },[query,page,revision]);
  const refresh=()=>{setError('');setData(null);setRevision(v=>v+1);};
  const change = e => setEditor(previous => ({ ...previous, [e.target.name]: e.target.value }));
  const submit = async e => {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await saveUser(editor.id, { ...editor, password: editor.password || null });
      if (String(editor.id) === String(user.id)) { logout(); navigate('/?auth=login', { replace: true }); return; }
      setEditor(null); setData(null); setRevision(value => value + 1);
      setNotice('Usuario guardado. Las sesiones anteriores de la cuenta editada quedaron invalidadas.');
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };
  async function remove(account) {
    if(busy)return;
    const confirmation=window.prompt('Eliminación definitiva: se borrarán los datos personales, postulaciones, CV y notificaciones. Se conserva auditoría y se reasignan ofertas compartidas. Escribe el correo de la cuenta para confirmar:', '');
    if(confirmation!==account.email)return;
    setBusy(true);setError('');setNotice('');
    try{await deleteUser(account.id);setEditor(null);setData(null);setPage(0);setRevision(v=>v+1);setNotice('Cuenta eliminada definitivamente. Auditoría conservada.');}
    catch(e){setError(e.message);}finally{setBusy(false);}
  }
  const field = 'w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900';
  return <main className="admin-workspace">
    <div className="page-heading">
      <div><p className="eyebrow">Administración</p><h1 className="text-3xl font-bold text-slate-900">Gestión de usuarios</h1><p className="subtitle">Crea cuentas, cambia permisos y activa o desactiva accesos.</p></div>
      <button disabled={busy} className="btn btn-primary" onClick={() => { setEditor({ ...empty }); setError(''); setNotice(''); }}><Plus size={16}/>Registrar usuario</button>
    </div>

    {error && <div role="alert" className="alert">{error}<button className="btn" type="button" onClick={refresh}>Reintentar consulta</button></div>}
    {notice && <p role="status" className="alert success">{notice}</p>}
    {editor && <form onSubmit={submit} className="editor space-y-4">
      <h2 className="text-xl font-semibold">{editor.id ? 'Editar usuario' : 'Nuevo usuario'}</h2>
      <fieldset disabled={busy} className="grid gap-4 md:grid-cols-2">
        <label>Correo<input className={field} name="email" type="email" required maxLength={150} value={editor.email} onChange={change} /></label>
        <label>{editor.id ? 'Nueva contraseña (opcional)' : 'Contraseña'}<input className={field} name="password" type="password" autoComplete="new-password" required={!editor.id} minLength={12} maxLength={72} value={editor.password} onChange={change} /></label>
        <label>Rol<select className={field} name="rol" value={editor.rol} onChange={change}><option>CANDIDATO</option><option>RECLUTADOR</option><option>ADMIN</option></select></label>
        <label>Estado<select className={field} name="estado" value={editor.estado} onChange={change}><option value="activo">Activo</option><option value="inactivo">Inactivo</option></select></label>
        {editor.rol === 'CANDIDATO' && <>
          <label>Nombres<input className={field} name="nombres" required maxLength={100} value={editor.nombres} onChange={change} /></label>
          <label>Apellidos<input className={field} name="apellidos" required maxLength={100} value={editor.apellidos} onChange={change} /></label>
          <label>Teléfono internacional (opcional)<input className={field} name="telefono" placeholder="+51987654321" maxLength={16} pattern="\+[1-9][0-9]{7,14}" value={editor.telefono} onChange={change} /></label>
        </>}
      </fieldset>
      <p className="text-xs text-slate-500">Las contraseñas se guardan con BCrypt y nunca se muestran. Editar tu propia cuenta requiere iniciar sesión de nuevo.</p>
      <div className="flex gap-3"><button disabled={busy} className="rounded-lg bg-red-700 px-4 py-2 text-white disabled:opacity-50">{busy ? 'Guardando…' : 'Guardar'}</button><button disabled={busy} type="button" className="rounded-lg border px-4 py-2" onClick={() => setEditor(null)}>Cancelar</button></div>
    </form>}
    <section className="surface" aria-label="Directorio de usuarios">
    <form className="toolbar" role="search" onSubmit={e=>{e.preventDefault();refresh();}}>
      <div className="search-field"><Search aria-hidden="true"/><input aria-label="Buscar por correo" type="search" maxLength={150} placeholder="Buscar por correo…" value={query} onChange={e=>{setQuery(e.target.value);setPage(0);setData(null);setError('');}} /></div>
      <span className="muted">Búsqueda automática</span><button className="btn" type="submit" disabled={busy}><RefreshCw size={14}/>Actualizar</button>
    </form>
    {!data ? !error && <p role="status" className="empty-state">Buscando usuarios…</p> : <>
      <div className="table-scroll"><table className="w-full text-left text-sm"><thead className="bg-slate-100"><tr>{['ID','Correo','Rol','Estado','Acciones'].map(label => <th key={label} className="p-3">{label}</th>)}</tr></thead><tbody>
        {data.items.map(account => <tr key={account.id} className="border-t"><td className="p-3">{account.id}</td><td className="p-3">{account.email}</td><td className="p-3"><span className={"pill "+account.rol.toLowerCase()}>{account.rol}</span></td><td className="p-3"><span className={"pill "+account.estado}>{account.estado==='activo'?'Activo':'Inactivo'}</span></td><td className="p-3"><button disabled={busy} className="font-semibold text-red-700" onClick={() => { setEditor({ ...account, password: '' }); setError(''); setNotice(''); }}>Editar</button><button disabled={busy||String(account.id)===String(user.id)} onClick={()=>remove(account)} className="ml-4 font-semibold text-red-700 underline disabled:opacity-40">Eliminar cuenta</button></td></tr>)}
        {!data.items.length && <tr><td colSpan={5} className="p-5 text-center">No hay usuarios que coincidan con tu búsqueda.</td></tr>}
      </tbody></table></div>
      <div className="pagination"><span>{data.total} usuarios · Página {page + 1}</span><div className="flex gap-3"><button disabled={page === 0} onClick={() => { setData(null); setPage(p => p - 1); }} className="btn">Anterior</button><button disabled={(page + 1) * 25 >= data.total} onClick={() => { setData(null); setPage(p => p + 1); }} className="rounded border p-2 disabled:opacity-40">Siguiente</button></div></div>
    </>}
    </section>
  </main>;
}
