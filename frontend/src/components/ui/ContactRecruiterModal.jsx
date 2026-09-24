import { useMemo, useState } from "react";
import { MessageSquare, X } from "lucide-react";

export default function ContactRecruiterModal({ isOpen, onClose, jobTitle = "Oferta GTEL", recruiterName = "Equipo GTEL" }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const resetState = () => {
    setSubject("");
    setMessage("");
    setSubmitted(false);
  };

  const canSubmit = useMemo(() => subject.trim().length > 0 && message.trim().length > 0, [subject, message]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-md">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-brand-red ring-1 ring-red-100">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-gray">Contacto</p>
              <h3 className="text-lg font-bold text-brand-navy">Contactar reclutador</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              resetState();
              onClose();
            }}
            className="rounded-lg p-2 text-brand-gray transition-colors hover:bg-slate-100 hover:text-brand-navy"
            aria-label="Cerrar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!submitted ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-brand-gray">Vacante</p>
              <p className="mt-1 text-sm font-semibold text-brand-navy">{jobTitle}</p>
              <p className="mt-1 text-xs text-brand-gray">{recruiterName}</p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-brand-navy">Asunto</label>
              <input
                type="text"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Consulta sobre la oferta"
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-brand-navy">Mensaje</label>
              <textarea
                rows={5}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Escribe tu consulta para el reclutador..."
                className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
              />
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  resetState();
                  onClose();
                }}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-brand-gray transition-colors hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => canSubmit && setSubmitted(true)}
                disabled={!canSubmit}
                className="rounded-xl bg-brand-red px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-red-hover disabled:cursor-not-allowed disabled:bg-red-300"
              >
                Enviar mensaje
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <MessageSquare className="h-5 w-5" />
            </div>
            <h4 className="text-lg font-bold text-brand-navy">Mensaje enviado</h4>
            <p className="mt-2 text-sm text-brand-gray">
              El reclutador recibirá tu consulta y se pondrá en contacto contigo pronto.
            </p>
            <button
              type="button"
              onClick={() => {
                resetState();
                onClose();
              }}
              className="mt-5 rounded-xl bg-brand-red px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-red-hover"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
