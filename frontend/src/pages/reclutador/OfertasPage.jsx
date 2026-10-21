import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Briefcase, Search, ArrowLeft, Edit3, PauseCircle, PlayCircle, XCircle, Check, X, AlertCircle } from 'lucide-react';
import { getRecruiterJobs, getRecruiterJob, updateRecruiterJob, updateRecruiterJobStatus } from '../../services/api';
import useRecruiterData from '../../hooks/useRecruiterData';
import DataState from '../../components/ui/DataState';

const statusLabels = {
  activa: 'Activa',
  pausada: 'Pausada',
  cerrada: 'Cerrada',
};

const statusColors = {
  activa: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  pausada: 'bg-amber-100 text-amber-800 border-amber-200',
  cerrada: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function RecruiterJobs() {
  const { data, loading, error, retry } = useRecruiterData(getRecruiterJobs);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const jobs = data || [];
  const filtered = jobs.filter(job =>
    (`${job.title} ${job.location} ${job.department || ''}`.toLowerCase().includes(search.trim().toLowerCase())) &&
    (status === 'all' || job.status === status)
  );

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-brand-navy">Ofertas publicadas</h1>
          <p className="text-sm text-brand-gray">Gestiona las convocatorias de tu organización conectadas a MySQL.</p>
        </div>
        <Link
          to="/reclutador/publicar-oferta"
          className="rounded-lg bg-brand-red px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-red-hover"
        >
          + Publicar Oferta
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-gray-100 bg-white p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            aria-label="Buscar ofertas"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por puesto, área o ubicación..."
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
          />
        </div>
        <select
          aria-label="Estado de la oferta"
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20"
        >
          <option value="all">Todos los estados</option>
          <option value="activa">Activas</option>
          <option value="pausada">Pausadas</option>
          <option value="cerrada">Cerradas</option>
        </select>
      </div>

      <DataState
        loading={loading}
        error={error}
        retry={retry}
        empty={!filtered.length}
        emptyMessage={jobs.length ? 'No hay resultados para estos filtros.' : 'No hay ofertas publicadas.'}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map(job => {
          const pillClass = statusColors[job.status] || 'bg-gray-100 text-gray-700';
          return (
            <article key={job.id} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-brand-red flex-shrink-0" />
                  <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${pillClass}`}>
                    {statusLabels[job.status] || job.status}
                  </span>
                </div>
                {job.department && (
                  <span className="text-xs text-brand-gray font-medium">{job.department}</span>
                )}
              </div>
              <h2 className="font-bold text-brand-navy text-base">{job.title}</h2>
              <p className="mt-1 text-sm text-brand-gray">{job.location} · {job.type}</p>
              <p className="my-2 text-sm font-semibold text-slate-800">{job.salary}</p>
              <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                <span className="text-xs text-brand-gray">Publicado: {job.date}</span>
                <Link to={`/reclutador/ofertas/${encodeURIComponent(job.id)}`} className="text-sm font-semibold text-brand-red hover:underline">
                  Ver y editar →
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export function RecruiterJobDetail() {
  const { id } = useParams();
  const load = useCallback(() => getRecruiterJob(id), [id]);
  const { data: job, loading, error, retry } = useRecruiterData(load);

  const [currentJob, setCurrentJob] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    type: 'Full-Time',
    salaryMin: '',
    salaryMax: '',
    description: '',
    department: ''
  });
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const activeJob = currentJob || job;

  const startEdit = () => {
    if (!activeJob) return;
    setFormData({
      title: activeJob.title || '',
      location: activeJob.location || '',
      type: activeJob.type || 'Full-Time',
      salaryMin: activeJob.salaryMin ?? 1500,
      salaryMax: activeJob.salaryMax ?? 2500,
      description: activeJob.description || '',
      department: activeJob.department || 'Ventas y Comercial',
      vacancies: activeJob.vacancies || 1
    });
    setActionError('');
    setActionSuccess('');
    setEditing(true);
  };

  const handleSaveEdit = async e => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      setActionError('El título y la descripción son obligatorios.');
      return;
    }
    setSaving(true);
    setActionError('');
    try {
      const updated = await updateRecruiterJob(id, formData);
      setCurrentJob(updated);
      setEditing(false);
      setActionSuccess('¡Oferta actualizada exitosamente en MySQL!');
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setActionError(err.message || 'No se pudo actualizar la oferta.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async newStatus => {
    setActionError('');
    setActionSuccess('');
    try {
      const updated = await updateRecruiterJobStatus(id, newStatus);
      setCurrentJob(updated);
      setActionSuccess(`Estado cambiado a: ${statusLabels[newStatus] || newStatus}`);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setActionError(err.message || 'No se pudo cambiar el estado de la oferta.');
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-6">
      <Link to="/reclutador/ofertas" className="inline-flex items-center gap-1.5 text-sm text-brand-red font-medium hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Volver a ofertas
      </Link>

      <DataState
        loading={loading}
        error={error}
        retry={retry}
        empty={!activeJob}
        emptyMessage="No se encontró la oferta solicitada."
      />

      {actionSuccess && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {activeJob && !editing && (
        <article className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusColors[activeJob.status] || 'bg-gray-100 text-gray-700'}`}>
                  {statusLabels[activeJob.status] || activeJob.status}
                </span>
                {activeJob.department && (
                  <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                    {activeJob.department}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-brand-navy">{activeJob.title}</h1>
              <p className="mt-1 text-sm text-brand-gray">{activeJob.location} · {activeJob.type} · {activeJob.salary}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={startEdit}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                Editar oferta
              </button>
              {activeJob.status === 'activa' && (
                <button
                  onClick={() => handleStatusChange('pausada')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors"
                >
                  <PauseCircle className="h-3.5 w-3.5 text-amber-600" />
                  Pausar
                </button>
              )}
              {activeJob.status === 'pausada' && (
                <button
                  onClick={() => handleStatusChange('activa')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
                >
                  <PlayCircle className="h-3.5 w-3.5 text-emerald-600" />
                  Reactivar
                </button>
              )}
              {activeJob.status !== 'cerrada' ? (
                <button
                  onClick={() => handleStatusChange('cerrada')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100 transition-colors"
                >
                  <XCircle className="h-3.5 w-3.5 text-red-600" />
                  Cerrar
                </button>
              ) : (
                <button
                  onClick={() => handleStatusChange('activa')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
                >
                  <PlayCircle className="h-3.5 w-3.5 text-emerald-600" />
                  Reabrir vacante
                </button>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Descripción del puesto</h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {activeJob.description || 'Sin descripción disponible.'}
            </p>
          </div>
        </article>
      )}

      {activeJob && editing && (
        <form onSubmit={handleSaveEdit} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-lg font-bold text-brand-navy">Editar Oferta Laboral</h2>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Título del puesto *</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ubicación / Sede</label>
              <input
                type="text"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Jornada</label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20"
              >
                <option value="Full-Time">Full-Time (8 horas)</option>
                <option value="Part-Time">Part-Time (4 horas)</option>
                <option value="Por turnos">Por turnos</option>
                <option value="Freelance">Freelance</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sueldo Mínimo (S/)</label>
              <input
                type="number"
                value={formData.salaryMin}
                onChange={e => setFormData({ ...formData, salaryMin: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sueldo Máximo (S/)</label>
              <input
                type="number"
                value={formData.salaryMax}
                onChange={e => setFormData({ ...formData, salaryMax: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción del puesto *</label>
            <textarea
              rows={6}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 resize-none"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand-red px-5 py-2 text-sm font-semibold text-white hover:bg-brand-red-hover disabled:opacity-50"
            >
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
