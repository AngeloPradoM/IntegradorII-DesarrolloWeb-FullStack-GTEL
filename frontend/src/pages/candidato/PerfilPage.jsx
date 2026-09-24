import { useNavigate } from "react-router-dom";
import { UserCircle2, Mail, Briefcase, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function PerfilPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-red/10 text-brand-red ring-1 ring-brand-red/10">
              <UserCircle2 className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-gray">Perfil</p>
              <h1 className="text-2xl font-semibold text-brand-navy">Mi perfil</h1>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-brand-gray">Datos generales</p>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-brand-gray">Nombre</p>
                <p className="mt-1 text-sm font-semibold text-brand-navy">{user?.nombres || "Usuario"}</p>
              </div>
              <div>
                <p className="text-xs text-brand-gray">Correo</p>
                <p className="mt-1 flex items-center gap-2 text-sm font-medium text-brand-navy">
                  <Mail className="h-4 w-4 text-brand-red" />
                  {user?.email || "usuario@demo.gtel.com"}
                </p>
              </div>
              <div>
                <p className="text-xs text-brand-gray">Rol</p>
                <p className="mt-1 flex items-center gap-2 text-sm font-medium text-brand-navy">
                  <ShieldCheck className="h-4 w-4 text-brand-red" />
                  {user?.rol === "RECLUTADOR" ? "Reclutador" : "Candidato"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-brand-gray">Resumen</p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                <Briefcase className="h-4 w-4 text-brand-red" />
                <span className="text-sm text-brand-gray">Perfil activo en GTEL Talento</span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-brand-gray">
                Aquí puedes consultar la información asociada a tu cuenta y volver a tus procesos cuando lo necesites.
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-brand-gray transition-colors hover:bg-slate-100"
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}
