import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { request, jsonRequest } from '../../services/workflowService';
export default function JobEditor(){
 const {id}=useParams();const [form,setForm]=useState(null);const [error,setError]=useState('');const [notice,setNotice]=useState('');const [busy,setBusy]=useState(false);
 useEffect(()=>{let active=true;request('/api/recruiter/jobs').then(rows=>{if(active){const job=rows.find(r=>String(r.id)===id);if(!job)throw new Error('Oferta no encontrada');setForm({...job,deadline:job.deadline||'',tagsText:(job.tags||[]).join(', ')});}}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[id]);
 const change=e=>setForm(p=>({...p,[e.target.name]:e.target.value}));
 async function save(e){e.preventDefault();setBusy(true);setError('');setNotice('');try{const result=await jsonRequest('/api/recruiter/jobs/'+id,'PUT',{...form,vacancies:Number(form.vacancies),salaryMin:Number(form.salaryMin),salaryMax:Number(form.salaryMax),deadline:form.deadline||null,tags:form.tagsText.split(',').map(t=>t.trim()).filter(Boolean)});setForm({...result,deadline:result.deadline||'',tagsText:(result.tags||[]).join(', ')});setNotice('Oferta actualizada.');}catch(e){setError(e.message);}finally{setBusy(false);}}
 const cls='block w-full rounded border p-2';
 return <main className="mx-auto max-w-3xl p-6"><Link to="/reclutador/ofertas">← Ofertas</Link><h1 className="my-4 text-2xl font-bold">Editar oferta</h1>{error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}{form&&<form onSubmit={save} className="space-y-4"><fieldset disabled={busy} className="space-y-4">
 {['title','department','location'].map((key,i)=><label key={key} className="block">{['Título','Área','Ubicación'][i]}<input className={cls} name={key} value={form[key]} onChange={change} required maxLength={key==='department'?80:150}/></label>)}
 <label className="block">Descripción<textarea className={cls} name="description" value={form.description} onChange={change} required maxLength={10000}/></label>
 {['education','experience','tagsText'].map((key,i)=><label className="block" key={key}>{['Formación requerida','Experiencia mínima','Habilidades (separadas por comas)'][i]}<input className={cls} name={key} value={form[key]||''} onChange={change} maxLength={key==='tagsText'?255:80}/></label>)}
 {['salaryMin','salaryMax','vacancies'].map((key,i)=><label className="block" key={key}>{['Sueldo mínimo','Sueldo máximo','Cantidad de vacantes'][i]}<input className={cls} type="number" name={key} min={key==='vacancies'?1:0} step={key==='vacancies'?1:0.01} required value={form[key]} onChange={change}/></label>)}
 <label className="block">Jornada<select className={cls} name="type" value={form.type} onChange={change}>{['full_time','part_time','por_turnos','freelance'].map(v=><option key={v}>{v}</option>)}</select></label>
 <label className="block">Modalidad<select className={cls} name="modality" value={form.modality} onChange={change}>{['presencial','remoto','hibrido'].map(v=><option key={v}>{v}</option>)}</select></label>
 <label className="block">Estado<select className={cls} name="status" value={form.status} onChange={change}><option value="activa">Abierta</option><option value="pausada">Pausada</option><option value="cerrada">Cerrada</option></select></label>
 <label className="block">Fecha límite<input className={cls} type="date" name="deadline" value={form.deadline} onChange={change}/></label><button className="rounded bg-brand-red p-3 text-white">{busy?'Guardando…':'Guardar'}</button>
 </fieldset></form>}</main>;
}
