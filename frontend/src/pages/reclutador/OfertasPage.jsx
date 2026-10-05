import { request } from '../../services/workflowService';
import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Briefcase, Search } from 'lucide-react';
import { getRecruiterJobs, getRecruiterJob } from '../../services/api';
import useRecruiterData from '../../hooks/useRecruiterData';
import DataState from '../../components/ui/DataState';

export default function RecruiterJobs() {
  const {data,loading,error,retry} = useRecruiterData(getRecruiterJobs);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState('');
  async function remove(job){
    if(!window.confirm('¿Enviar "'+job.title+'" a la papelera? Podrás restaurarla por 30 días. Después se eliminarán definitivamente la oferta, sus postulaciones, CV, entrevistas, evaluaciones e historial.'))return;
    setBusy(true);setMessage('');
    try{await request('/api/recruiter/jobs/'+job.id,{method:'DELETE'});setMessage('Oferta enviada a la papelera por 30 días.');retry();}
    catch(e){setMessage(e.message);}finally{setBusy(false);}
  }
  const [search,setSearch] = useState('');
  const [status,setStatus] = useState('all');
  const jobs = data || [];
  const filtered = jobs.filter(job=>(`${job.title} ${job.location}`.toLowerCase().includes(search.trim().toLowerCase())) && (status==='all' || job.status===status));
  return <div className="space-y-5 p-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-xl font-bold text-brand-navy">Ofertas publicadas</h1><p className="text-sm text-brand-gray">Gestiona las oportunidades de tu organización.</p></div><Link to="/reclutador/publicar-oferta" className="rounded-lg bg-brand-red px-4 py-2 text-sm font-semibold text-white">+ Publicar Oferta</Link></div>
    <Link to="/reclutador/ofertas/papelera" className="inline-block text-brand-red underline">Papelera (30 días)</Link><p role="status">{message}</p>
    <div className="flex flex-wrap gap-3 rounded-xl border border-gray-100 bg-white p-4"><div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input aria-label="Buscar ofertas" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por puesto o ubicación..." className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm" /></div><select aria-label="Estado de la oferta" value={status} onChange={e=>setStatus(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm"><option value="all">Todos los estados</option>{[...new Set(jobs.map(job=>job.status))].map(value=><option key={value} value={value}>{value==='unknown'?'Sin estado disponible':value}</option>)}</select></div>
    <DataState loading={loading} error={error} retry={retry} empty={!filtered.length} emptyMessage={jobs.length?'No hay resultados para estos filtros.':'No hay ofertas publicadas.'} />
    <div className="grid gap-4 md:grid-cols-2">{filtered.map(job=><article key={job.id} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"><Briefcase className="mb-3 h-5 w-5 text-brand-red" /><h2 className="font-bold text-brand-navy">{job.title}</h2><p className="mt-1 text-sm text-brand-gray">{job.location} · {job.type}</p><p className="my-3 text-sm text-brand-gray">{job.salary}</p><Link to={`/reclutador/ofertas/${encodeURIComponent(job.id)}`} className="text-sm font-semibold text-brand-red">Ver detalle</Link><button disabled={busy} onClick={()=>remove(job)} className="ml-4 text-sm text-red-700 underline">Eliminar oferta</button></article>)}</div>
  </div>;
}

export function RecruiterJobDetail() {
  const {id} = useParams();
  const load = useCallback(()=>getRecruiterJob(id),[id]);
  const {data:job,loading,error,retry} = useRecruiterData(load);
  return <div className="mx-auto max-w-4xl space-y-5 p-6"><Link to="/reclutador/ofertas" className="text-sm text-brand-red">← Volver a ofertas</Link><DataState loading={loading} error={error} retry={retry} empty={!job} emptyMessage="No se encontró la oferta solicitada." />{job && <article className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"><h1 className="text-2xl font-bold text-brand-navy">{job.title}</h1><p className="my-3 text-brand-gray">{job.location} · {job.type} · {job.salary}</p><p className="whitespace-pre-wrap text-sm text-brand-gray">{job.description || 'Sin descripción disponible.'}</p><Link to={`/reclutador/ofertas/${id}/editar`} className="mt-6 inline-block rounded border p-3 text-brand-red">Editar oferta</Link></article>}</div>;
}
