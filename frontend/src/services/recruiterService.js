import { recruiterTransport, RecruiterServiceError } from './recruiterTransport';
import { normalizeCollection, normalizeCandidate, normalizeJob, normalizeInterview, normalizeEvaluation, normalizeNotification } from './recruiterAdapters';
import { validateJob } from '../utils/formValidation';

export function recruiterErrorMessage(error) {
  if (error?.userFacing) return error.message;
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
  const [candidates, jobs, interviews, evaluations] = await Promise.all([getRecruiterCandidates(),getRecruiterJobs(),getRecruiterInterviews(),getRecruiterEvaluations()]);
  const areas = new Map();
  for (const candidate of candidates) if (candidate.department) areas.set(candidate.department,(areas.get(candidate.department) || 0)+1);
  return {newApplicants:candidates.length, scheduledInterviews:interviews.filter(i=>i.status==='programada').length, activeJobs:jobs.filter(j=>j.status==='activa').length, evaluations:evaluations.length, recentApplications:candidates.slice(0,5), applicationsByArea:[...areas].map(([name,value])=>({name,value}))};
}
export async function publishJob(data) {
  const errors = validateJob(data);
  if (Object.keys(errors).length) throw new RecruiterServiceError(Object.values(errors)[0], 'VALIDATION');
  const payload = {...data, title:data.title.trim(), description:data.description.trim(), location:data.location.trim(), salaryMin:Number(data.salaryMin), salaryMax:Number(data.salaryMax), vacancies:Number(data.vacancies)};
  return normalizeJob(await operation('publishJob',{data:payload}));
}
export async function updateCandidateStatus(id, status) {
  return normalizeCandidate(await operation('updateCandidateStatus',{id,status}));
}
export const updateRecruiterJob = async (id,data) => normalizeJob(await operation('updateJob',{id,data}));
export const scheduleRecruiterInterview = async data => normalizeInterview(await operation('scheduleInterview',{data}));
export const createRecruiterEvaluation = async data => normalizeEvaluation(await operation('createEvaluation',{data}));
