import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { jsonRequest } from '../../services/workflowService';
export default function RecoveryPage() {
  const [visible,setVisible] = useState(false);
  const [token] = useState(() => new URLSearchParams(location.hash.slice(1)).get('token'));
  useEffect(() => { if (token) history.replaceState(null, '', location.pathname); }, [token]);
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);
  async function submit(e) {
    e.preventDefault(); if (busy) return;
    if (token && password !== confirm) { setMessage('Las contraseñas no coinciden.'); return; }
    setBusy(true); setMessage('');
    try { const result = await jsonRequest(`/api/auth/password/${token ? 'reset' : 'request'}`, 'POST', token ? { token, password } : { email }, { publicAccess: true }); setMessage(result.message); if (token) setDone(true); }
    catch (error) { setMessage(error.message); } finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-lg p-8"><h1 className="mb-4 text-2xl font-bold">Recuperar acceso</h1>
    <p className="mb-4">{token ? 'Define una nueva contraseña de al menos 12 caracteres.' : 'Te enviaremos un enlace si el correo corresponde a una cuenta activa.'}</p>
    {!done && <form className="space-y-4" onSubmit={submit}>
      {token ? <><label className="block">Nueva contraseña<input className="block w-full rounded border p-3" type={visible ? "text" : "password"} autoComplete="new-password" minLength={12} maxLength={72} required value={password} onChange={e => setPassword(e.target.value)} /></label><label className="block">Confirmar contraseña<input className="block w-full rounded border p-3" type={visible ? "text" : "password"} autoComplete="new-password" required value={confirm} onChange={e => setConfirm(e.target.value)} /></label><button type="button" aria-pressed={visible} onClick={()=>setVisible(v=>!v)} className="text-brand-red underline">{visible ? "Ocultar contraseñas" : "Mostrar contraseñas"}</button></> : <label className="block">Correo<input className="block w-full rounded border p-3" type="email" required maxLength={150} value={email} onChange={e => setEmail(e.target.value)} /></label>}
      <button disabled={busy} className="rounded bg-brand-red p-3 text-white">{busy ? 'Procesando…' : token ? 'Cambiar contraseña' : 'Enviar enlace'}</button>
    </form>}<p role="status" className="my-4">{message}</p><Link to="/?auth=login" className="text-brand-red underline">Volver al inicio de sesión</Link>
  </main>;
}
