import { Inbox, LoaderCircle } from 'lucide-react';

export default function DataState({loading, error, empty, emptyMessage = 'Aún no hay información disponible.', retry}) {
  if (!loading && !error && !empty) return null;
  return <div className="rounded-xl border border-gray-100 bg-white p-6 text-center text-sm text-brand-gray" role={error ? 'alert' : 'status'}>
    {loading ? <><LoaderCircle className="mx-auto mb-3 h-6 w-6 animate-spin text-brand-red" />Cargando información…</> : error ? <><p>{error}</p>{retry && <button type="button" onClick={retry} className="mt-3 rounded-lg border border-slate-200 px-4 py-2 text-brand-red hover:bg-red-50">Reintentar</button>}</> : <><Inbox className="mx-auto mb-3 h-7 w-7 text-slate-300" />{emptyMessage}</>}
  </div>;
}
