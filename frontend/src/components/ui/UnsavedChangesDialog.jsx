import { useRef } from "react";
import { useBlocker } from "react-router-dom";
import useModalFocus from "../../hooks/useModalFocus";

export default function UnsavedChangesDialog({ dirty }) {
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search));
  const ref = useRef(null);
  const open = blocker.state === 'blocked';
  useModalFocus(ref, open, () => blocker.reset?.());
  if (!open) return null;
  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4" onClick={() => blocker.reset()}>
    <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="unsaved-title" tabIndex={-1} onClick={event => event.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-7 shadow-xl">
      <h2 id="unsaved-title" className="text-xl font-bold text-brand-navy">Tienes cambios sin guardar</h2><p className="my-4 text-sm text-brand-gray">Si sales ahora, perderás los cambios de tu perfil.</p>
      <div className="flex flex-wrap gap-3"><button type="button" onClick={() => blocker.reset()} className="rounded-lg border border-slate-200 px-4 py-3">Seguir editando</button><button type="button" onClick={() => blocker.proceed()} className="rounded-lg bg-brand-red px-4 py-3 text-white">Salir sin guardar</button></div>
    </div>
  </div>;
}
