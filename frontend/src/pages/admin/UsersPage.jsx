import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { listUsers, saveUser, deleteUser } from '../../services/adminService';

const empty = { email: '', password: '', rol: 'CANDIDATO', estado: 'activo', nombres: '', apellidos: '', telefono: '' };
export default function UsersPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editor, setEditor] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    listUsers(search, page, controller.signal).then(setData).catch(e => {
      if (e.name !== 'AbortError') setError(e.message);
    });
    return () => controller.abort();
  }, [search, page, revision]);
  const change = e => setEditor(previous => ({ ...previous, [e.target.name]: e.target.value }));
  const submit = async e => {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await saveUser(editor.id, { ...editor, password: editor.password || null });
      if (editor.id === user.id) { logout(); navigate('/?auth=login', { replace: true }); return; }
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
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><p className="text-sm font-semibold text-red-700">Administración</p><h1 className="text-3xl font-bold text-slate-900">Gestión de usuarios</h1><p className="mt-2 text-slate-600">Crea cuentas, cambia permisos y activa o desactiva accesos.</p></div>
      <button className="rounded-lg bg-red-700 px-4 py-3 font-semibold text-white" onClick={() => { setEditor({ ...empty }); setError(''); setNotice(''); }}>Registrar usuario</button>
    </div>
    <nav className="flex flex-wrap gap-4 text-sm font-semibold text-red-700" aria-label="Supervisión">
      <Link to="/admin/auditoria">Auditoría</Link><Link to="/notificaciones">Notificaciones</Link><Link to="/ofertas">Ofertas</Link><Link to="/mis-postulaciones">Vista candidato</Link><Link to="/reclutador/dashboard">Vista reclutador</Link>
    </nav>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{error}</p>}
    {notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-green-800">{notice}</p>}
    {editor && <form onSubmit={submit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold">{editor.id ? 'Editar usuario' : 'Nuevo usuario'}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <label>Correo<input className={field} name="email" type="email" required maxLength={150} value={editor.email} onChange={change} /></label>
        <label>{editor.id ? 'Nueva contraseña (opcional)' : 'Contraseña'}<input className={field} name="password" type="password" autoComplete="new-password" required={!editor.id} minLength={12} maxLength={72} value={editor.password} onChange={change} /></label>
        <label>Rol<select className={field} name="rol" value={editor.rol} onChange={change}><option>CANDIDATO</option><option>RECLUTADOR</option><option>ADMIN</option></select></label>
        <label>Estado<select className={field} name="estado" value={editor.estado} onChange={change}><option value="activo">Activo</option><option value="inactivo">Inactivo</option></select></label>
        {editor.rol === 'CANDIDATO' && <>
          <label>Nombres<input className={field} name="nombres" required maxLength={100} value={editor.nombres} onChange={change} /></label>
          <label>Apellidos<input className={field} name="apellidos" required maxLength={100} value={editor.apellidos} onChange={change} /></label>
          <label>Teléfono internacional (opcional)<input className={field} name="telefono" placeholder="+51987654321" maxLength={16} pattern="\+[1-9][0-9]{7,14}" value={editor.telefono} onChange={change} /></label>
        </>}
      </div>
      <p className="text-xs text-slate-500">Las contraseñas se guardan con BCrypt y nunca se muestran. Editar tu propia cuenta requiere iniciar sesión de nuevo.</p>
      <div className="flex gap-3"><button disabled={busy} className="rounded-lg bg-red-700 px-4 py-2 text-white disabled:opacity-50">{busy ? 'Guardando…' : 'Guardar'}</button><button disabled={busy} type="button" className="rounded-lg border px-4 py-2" onClick={() => setEditor(null)}>Cancelar</button></div>
    </form>}
    <form className="flex gap-3" onSubmit={e => { e.preventDefault(); setError(''); setData(null); setSearch(query); setPage(0); setRevision(v => v + 1); }}>
      <input aria-label="Buscar por correo" className={field} maxLength={150} placeholder="Buscar por correo" value={query} onChange={e => setQuery(e.target.value)} /><button className="rounded-lg border px-4">Buscar</button>
    </form>
    {!data ? !error && <p role="status">Cargando usuarios…</p> : <>
      <div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-100"><tr>{['ID','Correo','Rol','Estado','Acciones'].map(label => <th key={label} className="p-3">{label}</th>)}</tr></thead><tbody>
        {data.items.map(account => <tr key={account.id} className="border-t"><td className="p-3">{account.id}</td><td className="p-3">{account.email}</td><td className="p-3">{account.rol}</td><td className="p-3">{account.estado}</td><td className="p-3"><button className="font-semibold text-red-700" onClick={() => { setEditor({ ...account, password: '' }); setError(''); setNotice(''); }}>Editar</button><button disabled={busy||String(account.id)===String(user.id)} onClick={()=>remove(account)} className="ml-4 font-semibold text-red-700 underline disabled:opacity-40">Eliminar cuenta</button></td></tr>)}
        {!data.items.length && <tr><td colSpan={5} className="p-5 text-center">No se encontraron usuarios.</td></tr>}
      </tbody></table></div>
      <div className="flex items-center justify-between"><span>{data.total} usuarios · Página {page + 1}</span><div className="flex gap-3"><button disabled={page === 0} onClick={() => { setData(null); setPage(p => p - 1); }} className="rounded border p-2 disabled:opacity-40">Anterior</button><button disabled={(page + 1) * 25 >= data.total} onClick={() => { setData(null); setPage(p => p + 1); }} className="rounded border p-2 disabled:opacity-40">Siguiente</button></div></div>
    </>}
  </main>;
}
