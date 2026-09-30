import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { UserRound, ChevronDown, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const trigger = useRef(null);
  useEffect(() => {
    const close = event => { if (!ref.current?.contains(event.target)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  return <div ref={ref} className="relative" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }} onKeyDown={event => { if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); } }}>
    <button ref={trigger} type="button" aria-expanded={open} aria-controls="account-menu" onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-xl border border-white/20 p-1.5 text-white hover:bg-white/10">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-red">{user.foto ? <img src={user.foto} alt="" className="h-full w-full object-cover" /> : <UserRound className="h-4 w-4" />}</span><span className="max-w-24 truncate text-xs sm:max-w-40">{user.nombres} {user.apellidos}</span><ChevronDown className="h-4 w-4" />
    </button>
    {open && <div id="account-menu" className="absolute right-0 top-full z-50 mt-3 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-xl">
      <div className="mb-1 border-b border-slate-100 px-3 py-3"><p className="text-sm font-semibold">{user.nombres} {user.apellidos}</p><p className="break-all text-xs text-slate-500">{user.email}</p></div>
      {user.rol === "ADMIN" && <Link to="/admin" onClick={() => setOpen(false)} className="block rounded-lg p-3 text-sm hover:bg-slate-50">Panel administrador</Link>}
      <Link to="/perfil" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg p-3 text-sm hover:bg-slate-50"><UserRound className="h-4 w-4" />Editar perfil</Link>
      <button type="button" onClick={logout} className="flex w-full items-center gap-2 rounded-lg p-3 text-sm text-brand-red hover:bg-red-50"><LogOut className="h-4 w-4" />Cerrar sesión</button>
    </div>}
  </div>;
}
