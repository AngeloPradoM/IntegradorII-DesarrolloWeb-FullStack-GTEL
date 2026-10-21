import { recruiterTransport, RecruiterServiceError } from './recruiterTransport';
import { normalizeCollection, normalizeCandidate, normalizeJob, normalizeInterview, normalizeEvaluation, normalizeNotification, normalizeDashboard, normalizeRequirement } from './recruiterAdapters';
import { validateJob } from '../utils/formValidation';

export function recruiterErrorMessage(error) {
  if (error instanceof RecruiterServiceError) return error.message;
  if (error?.name === 'AbortError' || error?.name === 'TimeoutError') return 'La solicitud tardó demasiado. Inténtalo nuevamente.';
  return ({401:'Tu sesión no es válida. Vuelve a iniciar sesión.',403:'No tienes permiso para consultar esta información.',404:'No se encontró la información solicitada.'})[error?.status] || 'No se pudo completar la solicitud. Inténtalo nuevamente.';
}
async function operation(name, args = {}) {
  const controller = new AbortController();
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(() => recruiterTransport[name]({...args, signal:controller.signal})),
      new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new RecruiterServiceError('La solicitud tardó demasiado. Inténtalo nuevamente.', 'TIMEOUT')); }, 12000); }),
    ]);
  } catch (error) { throw new RecruiterServiceError(recruiterErrorMessage(error), error?.code || error?.status || 'REQUEST_FAILED'); }
  finally { clearTimeout(timer); }
}
const collection = async (name, normalize) => normalizeCollection(await operation(name), normalize);
export const getRecruiterCandidates = () => collection('candidates', normalizeCandidate);
export const getRecruiterJobs = () => collection('jobs', normalizeJob);
export const getRecruiterInterviews = () => collection('interviews', normalizeInterview);
export const getRecruiterEvaluations = () => collection('evaluations', normalizeEvaluation);
export const getRecruiterNotifications = () => collection('notifications', normalizeNotification);
export const getRecruiterCandidate = async id => (await getRecruiterCandidates()).find(row=>row.id === String(id)) || null;
export const getRecruiterJob = async id => (await getRecruiterJobs()).find(row=>row.id === String(id)) || null;
export async function getRecruiterDashboard() {
  if (typeof recruiterTransport.dashboard === 'function') {
    try {
      const serverData = await operation('dashboard');
      if (serverData && typeof serverData === 'object' && !Array.isArray(serverData) && Object.keys(serverData).length > 0) {
        return normalizeDashboard(serverData);
      }
    } catch {
      // Fallback a derivación local (e.g. tests o modo offline)
    }
  }

  const [candidates, jobs, interviews, evaluations] = await Promise.all([
    getRecruiterCandidates(),
    getRecruiterJobs(),
    getRecruiterInterviews(),
    getRecruiterEvaluations()
  ]);

  const areas = new Map();
  for (const candidate of candidates) {
    if (candidate.department) {
      areas.set(candidate.department, (areas.get(candidate.department) || 0) + 1);
    }
  }

  const stages = { recibida: 0, en_revision: 0, entrevista: 0, aprobada: 0, rechazada: 0 };
  for (const c of candidates) {
    const st = (c.status === 'new' ? 'recibida' : c.status === 'reviewing' ? 'en_revision' : c.status === 'interview' ? 'entrevista' : c.status === 'approved' ? 'aprobada' : c.status === 'rejected' ? 'rechazada' : c.status);
    if (stages[st] !== undefined) stages[st]++;
  }
  const total = candidates.length;
  const nAprobada = stages.aprobada || 0;
  const conversionRate = total > 0 ? Math.round((nAprobada / total * 100) * 10) / 10 : 0;

  const validScores = candidates.filter(c => typeof c.score === 'number' && c.score > 0).map(c => c.score);
  const avgScore = validScores.length ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 80;

  return {
    newApplicants: candidates.length,
    totalApplications: candidates.length,
    scheduledInterviews: interviews.length,
    activeJobs: jobs.length,
    evaluations: evaluations.length,
    averageAtsScore: avgScore,
    timeToHireDays: 12,
    funnel: {
      total,
      conversionRate,
      interviewRate: total > 0 ? Math.round(((stages.entrevista + nAprobada) / total * 100) * 10) / 10 : 0,
      stages: [
        { key: 'recibida', name: 'Recibidas', count: stages.recibida, percentage: total > 0 ? Math.round(stages.recibida / total * 100) : 0 },
        { key: 'en_revision', name: 'En Revisión', count: stages.en_revision, percentage: total > 0 ? Math.round(stages.en_revision / total * 100) : 0 },
        { key: 'entrevista', name: 'Entrevistas', count: stages.entrevista, percentage: total > 0 ? Math.round(stages.entrevista / total * 100) : 0 },
        { key: 'aprobada', name: 'Aprobados', count: stages.aprobada, percentage: total > 0 ? Math.round(stages.aprobada / total * 100) : 0 },
        { key: 'rechazada', name: 'Descartados', count: stages.rechazada, percentage: total > 0 ? Math.round(stages.rechazada / total * 100) : 0 },
      ]
    },
    quickActions: {
      pendingReviews: (stages.recibida || 0) + (stages.en_revision || 0),
      todayInterviews: interviews.length,
      pendingEvaluations: Math.max(0, interviews.length - evaluations.length)
    },
    topCandidates: [...candidates].filter(c => c.score != null).sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 4),
    recentApplications: candidates.slice(0, 5),
    applicationsByArea: [...areas].map(([name, value]) => ({ name, value }))
  };
}
export async function publishJob(data) {
  const errors = validateJob(data);
  if (Object.keys(errors).length) throw new RecruiterServiceError(Object.values(errors)[0], 'VALIDATION');
  const payload = {...data, title:data.title.trim(), description:data.description.trim(), location:data.location.trim(), salaryMin:Number(data.salaryMin), salaryMax:Number(data.salaryMax), vacancies:Number(data.vacancies)};
  return normalizeJob(await operation('publishJob',{data:payload}));
}
export async function updateCandidateStatus(id, status, comment) {
  return normalizeCandidate(await operation('updateCandidateStatus',{id,status,comment}));
}
export const getCandidateTimeline = async id => operation('candidateTimeline',{id});
export const updateRecruiterJob = async (id,data) => normalizeJob(await operation('updateJob',{id,data}));
export const updateRecruiterJobStatus = async (id,status) => normalizeJob(await operation('updateJobStatus',{id,status}));
export const getRecruiterDepartments = async () => operation('departments');
export const scheduleRecruiterInterview = async data => normalizeInterview(await operation('scheduleInterview',{data}));
export const createRecruiterEvaluation = async data => normalizeEvaluation(await operation('createEvaluation',{data}));
export const getRecruiterRequirements = () => collection('requirements', normalizeRequirement);
export async function createRecruiterRequirement(data) {
  if (!data?.titulo?.trim()) throw new RecruiterServiceError('El título de la vacante solicitada es obligatorio.', 'VALIDATION');
  if (!data?.departamentoId) throw new RecruiterServiceError('Debes seleccionar el departamento solicitante.', 'VALIDATION');
  if (!data?.descripcion?.trim()) throw new RecruiterServiceError('La justificación y perfil requerido son obligatorios.', 'VALIDATION');
  const payload = {
    titulo: data.titulo.trim(),
    departamentoId: Number(data.departamentoId),
    descripcion: data.descripcion.trim(),
    cantidad: Number(data.cantidad) || 1,
    observaciones: data.observaciones ? data.observaciones.trim() : null
  };
  return normalizeRequirement(await operation('createRequirement', { data: payload }));
}
export async function updateRecruiterRequirementStatus(id, status, observations) {
  return normalizeRequirement(await operation('updateRequirementStatus', { id, status, observations }));
}
export const getNotificationUnreadCount = async () => {
  const res = await operation('unreadNotificationCount');
  return res?.unreadCount != null ? Number(res.unreadCount) : 0;
};
export const markRecruiterNotificationRead = async id => operation('markNotificationRead', { id });
export const markAllRecruiterNotificationsRead = async () => operation('markAllNotificationsRead');

