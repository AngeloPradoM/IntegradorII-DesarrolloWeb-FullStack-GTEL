import { useEffect, useState } from 'react';
import { Search, RefreshCw, ShieldCheck } from 'lucide-react';
import { request } from '../../services/workflowService';
import './admin-workspace.css';

export default function AuditPage(){
  const [page,setPage]=useState(0),[result,setResult]=useState(null),[error,setError]=useState('');
  const [query,setQuery]=useState(''),[revision,setRevision]=useState(0);
  useEffect(()=>{const controller=new AbortController();let active=true;
    request('/api/admin/audit?page='+page,{signal:controller.signal}).then(r=>{if(active){setResult(r);setError('');}}).catch(e=>{if(active&&e.name!=='AbortError')setError(e.message);});
    return()=>{active=false;controller.abort();};
  },[page,revision]);
  const refresh=()=>{setResult(null);setError('');setRevision(v=>v+1);};
  const go=next=>{setResult(null);setError('');setQuery('');setPage(next);};
  const rows=(result?.items||[]).filter(r=>[r.actor,r.entidad,r.registro,r.accion,r.detalle].some(v=>String(v??'').toLowerCase().includes(query.trim().toLowerCase())));
  const hasNext=result&&(typeof result.total==='number'?(page+1)*25<result.total:result.hasMore===true);
  return <main className="admin-workspace">
    <div className="page-heading"><div><p className="eyebrow">Control y trazabilidad</p><h1>Auditoría</h1><p className="subtitle">Consulta quién realizó cada cambio y conserva el contexto de las operaciones.</p></div><button className="btn" onClick={refresh}><RefreshCw size={15}/>Actualizar</button></div>
    {error&&<div role="alert" className="alert">{error}<button className="btn" onClick={refresh}>Reintentar</button></div>}
    <section className="surface" aria-label="Historial de actividad">
      <div className="toolbar"><ShieldCheck size={18} className="text-slate-400"/><div className="search-field"><Search aria-hidden="true"/><input type="search" aria-label="Filtrar esta página de auditoría" placeholder="Responsable, entidad o acción…" value={query} onChange={e=>setQuery(e.target.value)}/></div><span className="muted">Filtro de la página actual</span></div>
      {!result&&!error&&<p role="status" className="empty-state">Cargando actividad…</p>}
      {result&&<><div className="table-scroll"><table><thead><tr>{['Fecha','Responsable','Entidad','Registro','Acción','Detalle'].map(label=><th key={label}>{label}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.id}><td className="whitespace-nowrap">{String(row.fecha??'—')}</td><td className="audit-actor">{row.actor||'Sistema'}</td><td>{row.entidad}</td><td className="muted">#{row.registro??'—'}</td><td><span className="pill">{row.accion}</span></td><td className="audit-detail">{row.detalle||'Sin detalle adicional'}</td></tr>)}</tbody></table></div>
      {!rows.length&&<div className="empty-state"><strong>{query?'Sin coincidencias en esta página':'Sin actividad registrada'}</strong>{query?'Prueba otro texto o limpia el filtro.':'Aquí aparecerá el historial de operaciones.'}</div>}
      <footer className="pagination"><span>Página {page+1} · {rows.length} registros visibles{typeof result.total==='number'?' de '+result.total+' en total':''}</span><div><button className="btn" disabled={!page} onClick={()=>go(page-1)}>Anterior</button><button className="btn" disabled={!hasNext} onClick={()=>go(page+1)}>Siguiente</button></div></footer></>}
    </section>
  </main>;
}
