import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { request } from '../../services/workflowService';
export default function AuditPage(){
  const [page,setPage]=useState(0);const [result,setResult]=useState(null);const [error,setError]=useState('');
  useEffect(()=>{let active=true;request(`/api/admin/audit?page=${page}`).then(r=>{if(active){setResult(r);setError('');}}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[page]);
  return <main className="mx-auto max-w-6xl p-6"><Link to="/admin">← Usuarios</Link><h1 className="my-4 text-2xl font-bold">Auditoría</h1>{error&&<p role="alert">{error}</p>}
    <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr>{['Fecha','Responsable','Entidad','ID','Acción','Detalle'].map(x=><th className="p-3" key={x}>{x}</th>)}</tr></thead><tbody>{result?.items.map(r=><tr key={r.id} className="border-t">{[r.fecha,r.actor,r.entidad,r.registro,r.accion,r.detalle].map((v,i)=><td className="p-3" key={i}>{String(v??'—')}</td>)}</tr>)}</tbody></table></div>
    <div className="mt-4 flex gap-4"><button disabled={!page} onClick={()=>setPage(p=>p-1)}>Anterior</button><span>Página {page+1}</span><button disabled={!result||(page+1)*25>=result.total} onClick={()=>setPage(p=>p+1)}>Siguiente</button></div>
  </main>;
}
