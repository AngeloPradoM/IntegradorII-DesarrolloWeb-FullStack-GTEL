import { Briefcase, X } from "lucide-react";

export default function AuthCardHeader({ title, subtitle, onClose, onPointerDown }) {
  return (
    <div onPointerDown={onPointerDown} className="relative cursor-grab touch-none bg-gradient-to-br from-[#1E293B] to-[#334155] p-7 text-center text-white active:cursor-grabbing">
      <button type="button" onClick={onClose} aria-label="Cerrar modal" className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white">
        <X className="h-5 w-5" />
      </button>
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-red">
        <Briefcase className="h-7 w-7" />
      </div>
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-1 text-xs text-white/60">{subtitle}</p>
    </div>
  );
}
