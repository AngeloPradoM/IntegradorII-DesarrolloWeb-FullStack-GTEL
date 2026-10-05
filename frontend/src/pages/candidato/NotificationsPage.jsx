import { useEffect, useState } from 'react';
import { request, jsonRequest } from '../../services/workflowService';
export default function NotificationsPage(){
 const [rows,setRows]=useState([]);const [error,setError]=useState('');
 useEffect(()=>{let active=true;request('/api/notifications').then(r=>{if(active)setRows(r);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[]);
 async function read(id){try{await jsonRequest(`/api/notifications/${id}/read`,'PUT',{});setRows(items=>items.map(i=>i.id===id?{...i,leida:true}:i));}catch(e){setError(e.message);}}
 return <main className="mx-auto max-w-3xl p-6"><h1 className="mb-5 text-2xl font-bold">Mis notificaciones</h1>{error&&<p role="alert">{error}</p>}{!rows.length&&!error&&<p>No hay notificaciones.</p>}{rows.map(r=><article className="mb-4 rounded border bg-white p-4" key={r.id}><h2 className="font-bold">{r.title}</h2><p className="my-2 whitespace-pre-wrap">{r.description}</p><small>{String(r.fecha)}</small>{!r.leida&&<button className="ml-4 text-brand-red" onClick={()=>read(r.id)}>Marcar leída</button>}</article>)}</main>;
}
