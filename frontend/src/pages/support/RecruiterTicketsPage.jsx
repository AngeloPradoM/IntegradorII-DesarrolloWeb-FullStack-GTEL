import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, LifeBuoy, Send } from 'lucide-react';
import { createSupportTicket, listSupportTickets } from '../../services/supportService';

const categories = {
  'Acceso y autenticación': ['No puedo iniciar sesión', 'No llega el código 2FA', 'Recuperación de contraseña'],
  Postulaciones: ['No puedo postular', 'Error al cargar CV', 'Estado incorrecto'],
  Ofertas: ['Oferta no visible', 'Datos incorrectos', 'Fecha límite'],
  Perfil: ['No guarda cambios', 'Foto de perfil', 'Datos de contacto'],
  Rendimiento: ['Página lenta', 'Error inesperado', 'Servicio no disponible'],
  Otro: ['Consulta general'],
};
const initial = { title: '', category: 'Acceso y autenticación', subcategory: 'No puedo iniciar sesión', priority: 'MEDIA', description: '', priorityJustification: '' };
const statusLabel = value => ({ NUEVO:'Nuevo', ASIGNADO:'Asignado', EN_ATENCION:'En atención', EN_ESPERA:'En espera', RESUELTO:'Resuelto', CERRADO:'Cerrado' }[value] || value);
const statusTone = value => value === 'RESUELTO' || value === 'CERRADO' ? 'bg-emerald-50 text-emerald-700' : value === 'EN_ESPERA' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700';

export default function RecruiterTicketsPage(){
  const [form,setForm]=useState(initial),[tickets,setTickets]=useState([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const subcategories=useMemo(()=>categories[form.category]||[],[form.category]);
  const load=signal=>listSupportTickets(signal).then(rows=>{setTickets(Array.isArray(rows)?rows:[]);setError('');}).catch(e=>{if(e.name!=='AbortError')setError(e.message);}).finally(()=>setLoading(false));
  useEffect(()=>{const controller=new AbortController();load(controller.signal);return()=>controller.abort();},[]);
  const change=e=>{const {name,value}=e.target;setForm(previous=>name==='category'?{...previous,category:value,subcategory:categories[value][0]}:{...previous,[name]:value});};
  const submit=async e=>{e.preventDefault();if(busy)return;setBusy(true);setError('');setNotice('');try{const created=await createSupportTicket(form);setTickets(previous=>[created,...previous]);setForm(initial);setNotice(`${created.code} fue enviado correctamente a la bandeja técnica.`);}catch(failure){setError(failure.message);}finally{setBusy(false);}};
  const field='mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white';
  return <div className="space-y-6 p-4 sm:p-6 lg:p-8">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-brand-red">Mesa de ayuda</p><h1 className="mt-1 text-3xl font-bold text-brand-navy dark:text-white">Solicitar soporte técnico</h1><p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-400">Describe la incidencia y conserva el seguimiento hasta su resolución.</p></div><div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-800"><LifeBuoy className="mr-2 inline h-4 w-4"/>Área solicitante: Reclutamiento</div></header>
    {error&&<p role="alert" className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertCircle className="h-5 w-5 shrink-0"/>{error}</p>}
    {notice&&<p role="status" className="flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 className="h-5 w-5 shrink-0"/>{notice}</p>}
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(560px,1.08fr)_minmax(420px,.92fr)]">
      <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="border-b border-slate-100 pb-4 dark:border-slate-800"><h2 className="text-lg font-bold text-brand-navy dark:text-white">Nuevo ticket</h2><p className="text-sm text-slate-500">Los campos permiten al técnico comprender y reproducir el problema.</p></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold sm:col-span-2">Título<input className={field} name="title" required maxLength={120} value={form.title} onChange={change} placeholder="Ej. Error al confirmar una postulación"/></label>
          <label className="text-sm font-semibold">Categoría<select className={field} name="category" value={form.category} onChange={change}>{Object.keys(categories).map(value=><option key={value}>{value}</option>)}</select></label>
          <label className="text-sm font-semibold">Subcategoría<select className={field} name="subcategory" value={form.subcategory} onChange={change}>{subcategories.map(value=><option key={value}>{value}</option>)}</select></label>
          <label className="text-sm font-semibold">Prioridad<select className={field} name="priority" value={form.priority} onChange={change}><option value="BAJA">Baja</option><option value="MEDIA">Media</option><option value="ALTA">Alta</option></select></label>
          <label className="text-sm font-semibold">Área<input className={field} value="Reclutamiento" readOnly/></label>
          <label className="text-sm font-semibold sm:col-span-2">Descripción<textarea className={field} name="description" required maxLength={2000} rows={5} value={form.description} onChange={change} placeholder="Explica qué acción realizaste, qué ocurrió y qué mensaje mostró el sistema."/></label>
          <label className="text-sm font-semibold sm:col-span-2">Justificación de prioridad<textarea className={field} name="priorityJustification" required maxLength={1000} rows={3} value={form.priorityJustification} onChange={change} placeholder="Indica usuarios afectados, bloqueo operativo y urgencia."/></label>
        </div>
        <div className="mt-5 flex justify-end"><button disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-brand-red px-5 py-3 text-sm font-bold text-white disabled:opacity-50"><Send className="h-4 w-4"/>{busy?'Enviando…':'Enviar a bandeja técnica'}</button></div>
      </form>
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <header className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800"><div><h2 className="font-bold text-brand-navy dark:text-white">Mis solicitudes</h2><p className="text-xs text-slate-500">Seguimiento en tiempo real</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold dark:bg-slate-800">{tickets.length}</span></header>
        <div className="max-h-[720px] space-y-3 overflow-y-auto p-4">{loading?<p role="status" className="p-8 text-center text-sm text-slate-500">Cargando tickets…</p>:tickets.length?tickets.map(ticket=><article key={ticket.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black tracking-wide text-brand-red">{ticket.code}</p><h3 className="mt-1 font-bold text-brand-navy dark:text-white">{ticket.title}</h3></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${ticket.priority==='ALTA'?'bg-red-50 text-red-700':ticket.priority==='MEDIA'?'bg-amber-50 text-amber-700':'bg-emerald-50 text-emerald-700'}`}>{ticket.priority}</span></div><p className="mt-2 text-xs text-slate-500">{ticket.category} · {ticket.subcategory}</p><div className="mt-3 flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${statusTone(ticket.status)}`}>{statusLabel(ticket.status)}</span><span className="inline-flex items-center gap-1 text-[11px] text-slate-500"><Clock3 className="h-3.5 w-3.5"/>{new Date(ticket.createdAt).toLocaleString('es-PE')}</span></div></article>):<p className="p-8 text-center text-sm text-slate-500">Aún no registraste tickets.</p>}</div>
      </section>
    </div>
  </div>;
}
