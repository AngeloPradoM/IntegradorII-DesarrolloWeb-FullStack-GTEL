import { useEffect, useState } from 'react';
import { Bell, CheckCheck, RefreshCw, Search } from 'lucide-react';
import { request, jsonRequest } from '../../services/workflowService';
import '../admin/admin-workspace.css';

export default function NotificationsPage(){
  const [rows,setRows]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const [filter,setFilter]=useState('all'),[query,setQuery]=useState(''),[revision,setRevision]=useState(0);
  useEffect(()=>{const controller=new AbortController();let active=true;
    request('/api/notifications',{signal:controller.signal}).then(r=>{if(active){setRows(r);setError('');}}).catch(e=>{if(active&&e.name!=='AbortError')setError(e.message);});
    return()=>{active=false;controller.abort();};
  },[revision]);
  const refresh=()=>{setRows(null);setError('');setRevision(v=>v+1);};
  const unread=(rows||[]).filter(r=>!r.leida);
  async function markRead(ids){
    if(busy||!ids.length)return;setBusy(true);setError('');
    // Keep successful updates even if one notification cannot be updated.
    const results=await Promise.allSettled(ids.map(id=>jsonRequest('/api/notifications/'+encodeURIComponent(id)+'/read','PUT',{})));
    const done=new Set(ids.filter((_,index)=>results[index].status==='fulfilled'));
    setRows(items=>items?.map(row=>done.has(row.id)?{...row,leida:true}:row)||[]);
    if(done.size<ids.length)setError('Algunas notificaciones no pudieron marcarse como leídas. Puedes volver a intentarlo.');
    window.dispatchEvent(new Event('gtel:notifications-changed'));setBusy(false);
  }
  const visible=(rows||[]).filter(r=>filter==='all'||(filter==='unread'?!r.leida:!!r.leida)).filter(r=>(r.title+' '+r.description).toLowerCase().includes(query.trim().toLowerCase()));
  return <main className="admin-workspace">
    <div className="page-heading"><div><p className="eyebrow">Centro de actividad</p><h1>Mis notificaciones</h1><p className="subtitle">Mantente al día y organiza los avisos que requieren tu atención.</p></div><div className="button-group"><button className="btn" disabled={busy} onClick={refresh}><RefreshCw size={15}/>Actualizar</button><button className="btn btn-primary" disabled={busy||!unread.length} onClick={()=>markRead(unread.map(r=>r.id))}><CheckCheck size={15}/>{busy?'Actualizando…':'Marcar todas como leídas'}</button></div></div>
    {error&&<div role="alert" className="alert">{error}<button disabled={busy} className="btn" onClick={refresh}>Actualizar lista</button></div>}
    <section className="surface" aria-label="Notificaciones">
      <div className="toolbar"><div className="filter-tabs" aria-label="Filtrar notificaciones">{[['all','Todas'],['unread','Sin leer'],['read','Leídas']].map(([id,label])=><button key={id} aria-pressed={filter===id} onClick={()=>setFilter(id)}>{label}{id==='unread'&&rows?' ('+unread.length+')':''}</button>)}</div><span className="count-label">{rows?unread.length+' pendientes':'Cargando…'}</span></div>
      <div className="toolbar"><div className="search-field"><Search aria-hidden="true"/><input type="search" aria-label="Buscar notificaciones" placeholder="Buscar en tus notificaciones…" value={query} onChange={e=>setQuery(e.target.value)}/></div></div>
      {!rows&&!error&&<p className="empty-state" role="status">Cargando notificaciones…</p>}
      {rows&&!visible.length&&<div className="empty-state"><strong>{query?'No encontramos coincidencias':filter==='unread'?'Estás al día':'No hay notificaciones'}</strong>{query?'Prueba otra palabra o limpia la búsqueda.':'Los nuevos avisos aparecerán aquí.'}</div>}
      {visible.map(row=><article className={'notification'+(!row.leida?' unread':'')} key={row.id}><span className="notification-icon"><Bell size={17} aria-hidden="true"/></span><div className="notification-body"><h2>{row.title} {!row.leida&&<span className="pill inactivo">Sin leer</span>}</h2><p>{row.description}</p><div className="notification-footer"><span className="muted">{String(row.fecha??'')}</span>{!row.leida?<button disabled={busy} className="btn" onClick={()=>markRead([row.id])}><CheckCheck size={14}/>Marcar leída</button>:<span className="muted">Leída</span>}</div></div></article>)}
    </section>
  </main>;
}
