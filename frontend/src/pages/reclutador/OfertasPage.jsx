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
  activa: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
  pausada: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
  cerrada: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
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
    <div className="recruiter-page space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="recruiter-title text-xl">Ofertas publicadas</h1>
          <p className="recruiter-copy text-sm">Gestiona las convocatorias de tu organización conectadas a MySQL.</p>
        </div>
        <Link
          to="/reclutador/publicar-oferta"
          className="rounded-lg bg-app-action px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-app-action-hover"
        >
          + Publicar Oferta
        </Link>
      </div>

      <div className="recruiter-card flex flex-col gap-3 p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            aria-label="Buscar ofertas"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por puesto, área o ubicación..."
            className="recruiter-field w-full py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <select
          aria-label="Estado de la oferta"
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="recruiter-field px-3 py-2 text-sm"
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
          const pillClass = statusColors[job.status] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
          return (
            <article key={job.id} className="recruiter-card recruiter-card-interactive p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-brand-red flex-shrink-0" />
                  <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${pillClass}`}>
                    {statusLabels[job.status] || job.status}
                  </span>
                </div>
                {job.department && (
                  <span className="recruiter-muted text-xs font-medium">{job.department}</span>
                )}
              </div>
              <h2 className="recruiter-title text-base">{job.title}</h2>
              <p className="recruiter-copy mt-1 text-sm">{job.location} · {job.type}</p>
              <p className="my-2 text-sm font-semibold text-app-primary">{job.salary}</p>
              <div className="mt-3 flex items-center justify-between border-t border-app-border pt-3">
                <span className="recruiter-muted text-xs">Publicado: {job.date}</span>
                <Link to={`/reclutador/ofertas/${encodeURIComponent(job.id)}`} className="text-sm font-semibold text-app-accent hover:underline">
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
    <div className="recruiter-page mx-auto max-w-4xl space-y-5 p-4 sm:p-6">
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
        <article className="recruiter-card space-y-6 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusColors[activeJob.status] || 'bg-gray-100 text-gray-700'}`}>
                  {statusLabels[activeJob.status] || activeJob.status}
                </span>
                {activeJob.department && (
                  <span className="rounded bg-app-muted px-2 py-0.5 text-xs font-medium text-app-body">
                    {activeJob.department}
                  </span>
                )}
              </div>
              <h1 className="recruiter-title text-2xl">{activeJob.title}</h1>
              <p className="recruiter-copy mt-1 text-sm">{activeJob.location} · {activeJob.type} · {activeJob.salary}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={startEdit}
                className="inline-flex items-center gap-1.5 rounded-lg border border-app-border-strong bg-app-surface px-3 py-1.5 text-xs font-semibold text-app-body transition-colors hover:bg-app-muted"
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

          <div className="border-t border-app-border pt-4">
            <h3 className="recruiter-muted mb-2 text-xs font-semibold uppercase tracking-wider">Descripción del puesto</h3>
            <p className="recruiter-copy whitespace-pre-wrap text-sm leading-relaxed">
              {activeJob.description || 'Sin descripción disponible.'}
            </p>
          </div>
        </article>
      )}

      {activeJob && editing && (
        <form onSubmit={handleSaveEdit} className="recruiter-card space-y-4 p-6">
          <div className="flex items-center justify-between border-b border-app-border pb-3">
            <h2 className="recruiter-title text-lg">Editar Oferta Laboral</h2>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded p-1 text-app-secondary hover:bg-app-muted hover:text-app-primary"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-app-primary">Título del puesto *</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="recruiter-field w-full px-3 py-2 text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-app-primary">Ubicación / Sede</label>
              <input
                type="text"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="recruiter-field w-full px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-app-primary">Tipo de Jornada</label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                className="recruiter-field w-full px-3 py-2 text-sm"
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
              <label className="mb-1 block text-xs font-semibold text-app-primary">Sueldo Mínimo (S/)</label>
              <input
                type="number"
                value={formData.salaryMin}
                onChange={e => setFormData({ ...formData, salaryMin: e.target.value })}
                className="recruiter-field w-full px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-app-primary">Sueldo Máximo (S/)</label>
              <input
                type="number"
                value={formData.salaryMax}
                onChange={e => setFormData({ ...formData, salaryMax: e.target.value })}
                className="recruiter-field w-full px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-app-primary">Descripción del puesto *</label>
            <textarea
              rows={6}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="recruiter-field w-full resize-none px-3 py-2 text-sm"
              required
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-app-border pt-3">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg border border-app-border px-4 py-2 text-sm font-medium text-app-secondary hover:bg-app-muted hover:text-app-primary"
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
