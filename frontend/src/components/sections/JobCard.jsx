import { MapPin, Sparkles, Wallet } from "lucide-react";
import Badge from "../common/Badge";
import Button from "../common/Button";

export default function JobCard({ job }) {
  return (
    <div className="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-lg">
      <button
        type="button"
        aria-label="Guardar oferta"
        className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-brand-red"
      >
        ♡
      </button>

      <div className="mb-4 flex flex-wrap gap-2">
        <Badge color="gray">{job.type}</Badge>
        {job.isNew && <Badge color="red">NUEVO</Badge>}
      </div>

      <h3 className="mb-3 text-lg font-bold text-brand-navy">{job.title}</h3>

      <div className="space-y-2 text-sm text-brand-gray">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-brand-red" />
          <span>{job.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-brand-red" />
          <span>{job.salary}</span>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Sparkles className="h-3.5 w-3.5 text-brand-red" />
          <span>GTEL Talento</span>
        </div>
        <Button>Postular</Button>
      </div>
    </div>
  );
}