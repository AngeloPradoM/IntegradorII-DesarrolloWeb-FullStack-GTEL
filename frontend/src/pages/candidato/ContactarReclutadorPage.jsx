import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, MessageSquare } from "lucide-react";

export default function ContactarReclutadorPage() {
  const [params] = useSearchParams();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const job = params.get("oferta") || "Consulta de postulación";
  const email = import.meta.env.VITE_RECRUITER_EMAIL || "talento@gtel.com.pe";
  return (
    <div className="min-h-screen bg-brand-bg px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Link to="/mis-postulaciones" className="mb-5 inline-flex items-center gap-2 text-sm text-brand-gray"><ArrowLeft className="h-4 w-4" />Mis postulaciones</Link>
        <form className="space-y-5 rounded-xl border border-gray-100 bg-white p-6 shadow-sm" onSubmit={event => {
          event.preventDefault();
          window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Oferta: ${job}\n\n${message}`)}`;
        }}>
          <div><MessageSquare className="mb-3 h-6 w-6 text-brand-red" /><h1 className="text-2xl font-bold text-brand-navy">Contactar reclutador</h1><p className="mt-1 text-sm text-brand-gray">{job}</p></div>
          <label className="block text-sm font-medium text-brand-navy">Asunto<input required value={subject} onChange={e => setSubject(e.target.value)} className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2.5" /></label>
          <label className="block text-sm font-medium text-brand-navy">Mensaje<textarea required rows={6} value={message} onChange={e => setMessage(e.target.value)} className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2.5" /></label>
          <p className="text-xs text-brand-gray">Se abrirá tu aplicación de correo para que revises y envíes el mensaje.</p>
          <button type="submit" className="rounded-lg bg-brand-red px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-red-hover">Preparar correo</button>
        </form>
      </div>
    </div>
  );
}
