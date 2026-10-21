import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { request, jsonRequest } from '../../services/workflowService';
import useRecruiterData from '../../hooks/useRecruiterData';
import DataState from '../../components/ui/DataState';
const load=()=>request('/api/recruiter/jobs/trash');
export default function JobTrash(){
 const [now,setNow]=useState(()=>Date.now());
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
 const {data,loading,error,retry}=useRecruiterData(load);
 const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
 async function restore(id){setBusy(true);setMessage('');try{await jsonRequest(`/api/recruiter/jobs/${id}/restore`,'POST',{});setMessage('Oferta restaurada como pausada. Edítala para publicarla nuevamente.');retry();}catch(e){setMessage(e.message);}finally{setBusy(false);}}
 return <main className="space-y-4 p-6"><Link to="/reclutador/ofertas" className="text-brand-red">Volver a ofertas</Link><h1 className="text-2xl font-bold">Papelera de ofertas</h1><p>Puedes restaurar una oferta durante 30 días. Después se eliminan definitivamente la oferta y sus postulaciones, CV, entrevistas, evaluaciones e historial asociados. Las cuentas de los candidatos se conservan.</p><p role="status">{message}</p><DataState loading={loading} error={error} retry={retry} empty={!data?.length} emptyMessage="La papelera está vacía."/>{data?.map(job=><article key={job.id} className="rounded border bg-white p-4"><h2 className="font-bold">{job.title}</h2><p>Plazo de restauración: {new Date(job.expiresAt).toLocaleString()}</p><button disabled={busy||job.expiresAt<=now} onClick={()=>restore(job.id)} className="mt-2 rounded border p-2 text-brand-red">{job.expiresAt<=now?'Pendiente de eliminación definitiva':'Restaurar oferta'}</button></article>)}</main>;
}
