import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Pencil, Plus, Search, ShieldCheck, Trash2, UserCheck, UserCog, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { deleteUser, listUsers, saveUser } from '../../services/adminService';
import './admin-workspace.css';

const emptyUser = { email: '', password: '', rol: 'CANDIDATO', estado: 'activo', nombres: '', apellidos: '', telefono: '' };
const roleLabels = { ADMIN: 'Administrador', RECLUTADOR: 'Reclutador', CANDIDATO: 'Candidato', TECNICO: 'Técnico' };

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
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => { setSearch(query.trim()); setPage(0); }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    setData(null); setError('');
    listUsers(search, page, controller.signal).then(setData).catch(cause => {
      if (cause.name !== 'AbortError') setError(cause.message);
    });
    return () => controller.abort();
  }, [search, page, revision]);

  const metrics = useMemo(() => {
    const rows = data?.items || [];
    return {
      total: data?.total ?? 0,
      active: rows.filter(account => account.estado === 'activo').length,
      admins: rows.filter(account => account.rol === 'ADMIN').length,
      operations: rows.filter(account => ['RECLUTADOR', 'TECNICO'].includes(account.rol)).length,
    };
  }, [data]);

  const change = event => setEditor(previous => ({ ...previous, [event.target.name]: event.target.value }));
  const openEditor = account => { setEditor(account ? { ...account, password: '' } : { ...emptyUser }); setError(''); setNotice(''); };

  const submit = async event => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await saveUser(editor.id, { ...editor, password: editor.password || null });
      if (String(editor.id) === String(user.id)) { logout(); navigate('/?auth=login', { replace: true }); return; }
      setEditor(null); setRevision(value => value + 1);
      setNotice('Usuario guardado correctamente. Sus sesiones anteriores quedaron invalidadas.');
    } catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await deleteUser(deleteTarget.id);
      setNotice(`La cuenta ${deleteTarget.email} y sus datos asociados fueron eliminados.`);
      setDeleteTarget(null); setRevision(value => value + 1);
    } catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  };

  return <main className="admin-workspace admin-workspace-wide">
    <div className="page-heading">
      <div><p className="eyebrow">Control de acceso</p><h1>Administración de usuarios</h1><p className="subtitle">Gestiona cuentas, roles y estados desde un único espacio de supervisión.</p></div>
      <button className="btn btn-primary" type="button" onClick={() => openEditor()}><Plus size={16}/>Registrar usuario</button>
    </div>

    <section className="metric-grid" aria-label="Resumen de usuarios">
      <article className="metric-card"><span className="metric-icon"><Users/></span><div><span className="metric-label">Usuarios registrados</span><strong className="metric-value">{metrics.total}</strong><small>Total en el sistema</small></div></article>
      <article className="metric-card"><span className="metric-icon success"><UserCheck/></span><div><span className="metric-label">Activos visibles</span><strong className="metric-value">{metrics.active}</strong><small>En esta página</small></div></article>
      <article className="metric-card"><span className="metric-icon violet"><ShieldCheck/></span><div><span className="metric-label">Administradores</span><strong className="metric-value">{metrics.admins}</strong><small>En esta página</small></div></article>
      <article className="metric-card"><span className="metric-icon blue"><UserCog/></span><div><span className="metric-label">Equipo operativo</span><strong className="metric-value">{metrics.operations}</strong><small>Reclutadores y técnicos visibles</small></div></article>
    </section>

    {error && <div role="alert" className="alert"><span><AlertTriangle size={16}/>{error}</span><button type="button" className="btn" onClick={() => setRevision(value => value + 1)}>Reintentar</button></div>}
    {notice && <div role="status" className="alert success"><span><CheckCircle2 size={16}/>{notice}</span></div>}

    {editor && <form onSubmit={submit} className="editor">
      <div className="editor-heading"><div><p className="eyebrow">Datos de acceso</p><h2>{editor.id ? 'Editar usuario' : 'Nuevo usuario'}</h2></div><span className="pill">{editor.id ? `ID #${editor.id}` : 'Nueva cuenta'}</span></div>
      <div className="editor-grid">
        <label>Correo electrónico<input name="email" type="email" required maxLength={150} value={editor.email} onChange={change}/></label>
        <label>{editor.id ? 'Nueva contraseña (opcional)' : 'Contraseña'}<input name="password" type="password" autoComplete="new-password" required={!editor.id} minLength={12} maxLength={72} value={editor.password} onChange={change}/></label>
        <label>Rol<select name="rol" value={editor.rol} onChange={change}>{Object.entries(roleLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Estado<select name="estado" value={editor.estado} onChange={change}><option value="activo">Activo</option><option value="inactivo">Inactivo</option></select></label>
        {editor.rol === 'CANDIDATO' && <><label>Nombres<input name="nombres" required maxLength={100} value={editor.nombres || ''} onChange={change}/></label><label>Apellidos<input name="apellidos" required maxLength={100} value={editor.apellidos || ''} onChange={change}/></label><label>Teléfono internacional (opcional)<input name="telefono" placeholder="+51987654321" maxLength={16} pattern="\+[1-9][0-9]{7,14}" value={editor.telefono || ''} onChange={change}/></label></>}
      </div>
      <p className="form-note">Las contraseñas se almacenan con BCrypt y nunca se muestran. Si editas tu propia cuenta, deberás iniciar sesión nuevamente.</p>
      <div className="editor-actions"><button disabled={busy} className="btn btn-primary">{busy ? 'Guardando…' : 'Guardar cambios'}</button><button disabled={busy} type="button" className="btn" onClick={() => setEditor(null)}>Cancelar</button></div>
    </form>}

    <section className="surface" aria-label="Directorio de usuarios">
      <div className="toolbar"><div className="search-field"><Search aria-hidden="true"/><input aria-label="Buscar usuarios por correo" type="search" maxLength={150} placeholder="Buscar por correo en tiempo real…" value={query} onChange={event => setQuery(event.target.value)}/></div><span className="count-label">{data ? `${data.items.length} visibles de ${data.total}` : 'Consultando directorio…'}</span></div>
      {!data && !error && <p role="status" className="empty-state">Cargando usuarios…</p>}
      {data && <><div className="table-scroll"><table><thead><tr>{['Usuario','Rol','Estado','Identificador','Acciones'].map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>
        {data.items.map(account => <tr key={account.id}><td><div className="user-identity"><span className="user-avatar">{account.email?.charAt(0).toUpperCase()}</span><div><strong>{account.email}</strong><small>{account.nombres || account.apellidos ? [account.nombres,account.apellidos].filter(Boolean).join(' ') : 'Sin nombre de perfil'}</small></div></div></td><td><span className={`pill ${account.rol?.toLowerCase()}`}>{roleLabels[account.rol] || account.rol}</span></td><td><span className={`pill ${account.estado}`}>{account.estado === 'activo' ? 'Activo' : 'Inactivo'}</span></td><td className="muted">#{account.id}</td><td><div className="row-actions"><button type="button" onClick={() => openEditor(account)}><Pencil size={14}/>Editar</button><button type="button" className="danger" disabled={String(account.id) === String(user.id)} title={String(account.id) === String(user.id) ? 'No puedes eliminar tu propia sesión' : undefined} onClick={() => setDeleteTarget(account)}><Trash2 size={14}/>Eliminar</button></div></td></tr>)}
      </tbody></table></div>
      {!data.items.length && <div className="empty-state"><strong>Sin resultados</strong>No hay usuarios que coincidan con “{search}”.</div>}
      <footer className="pagination"><span>Página {page + 1} · {data.total} usuarios</span><div><button className="btn" disabled={page === 0} onClick={() => setPage(value => value - 1)}>Anterior</button><button className="btn" disabled={(page + 1) * 25 >= data.total} onClick={() => setPage(value => value + 1)}>Siguiente</button></div></footer></>}
    </section>

    {deleteTarget && <div className="confirm-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !busy) setDeleteTarget(null); }}><section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-user-title"><span className="confirm-icon"><Trash2/></span><h2 id="delete-user-title">Eliminar cuenta</h2><p>Se eliminará <strong>{deleteTarget.email}</strong> y sus datos relacionados. La evidencia de auditoría se conservará.</p><div className="editor-actions"><button className="btn" disabled={busy} onClick={() => setDeleteTarget(null)}>Cancelar</button><button className="btn btn-danger" disabled={busy} onClick={confirmDelete}>{busy ? 'Eliminando…' : 'Eliminar definitivamente'}</button></div></section></div>}
  </main>;
}
