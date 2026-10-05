import { RecruiterServiceError } from './recruiterTransport';

const invalid = () => { throw new RecruiterServiceError('No se pudo interpretar la información recibida. Inténtalo nuevamente.', 'INVALID_RESPONSE'); };
const text = value => typeof value === 'string' ? value.trim() : '';
const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : invalid();
const list = value => value == null ? [] : Array.isArray(value) ? value : invalid();
const score = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100 ? value : null;
const identifier = value => typeof value === 'number' || typeof value === 'string' && value.trim() ? String(value) : invalid();
const initials = name => name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('');
const strings = value => list(value).map(item => typeof item === 'string' ? item : invalid());
const objects = (value, keys) => list(value).map(item => {
  record(item);
  return Object.fromEntries(keys.map(key => [key, key === 'score' ? score(item[key]) : text(item[key])]));
});
export const candidateStatuses = { recibida:'new', en_revision:'reviewing', entrevista:'interview', aprobada:'approved', rechazada:'rejected' };
export function normalizeCandidate(value) {
  const row = record(value);
  const name = text(row.name) || [text(row.nombres), text(row.apellidos)].filter(Boolean).join(' ');
  return {
    id:identifier(row.id), name:name || 'No disponible', avatar:initials(name),
    job:text(row.job) || 'No disponible', email:text(row.email) || 'No disponible',
    phone:text(row.phone) || 'No disponible', location:text(row.location) || 'No disponible', dni:text(row.dni) || 'No disponible',
    date:text(row.date) || 'No disponible', appliedDate:text(row.date) || 'No disponible', department:text(row.department),
    status:candidateStatuses[row.status] || (['new','reviewing','interview','approved','rejected'].includes(row.status) ? row.status : 'unknown'),
    score:score(row.score), experience:row.experienceText ? [{role:'Experiencia',company:'',period:'',desc:text(row.experienceText)}] : objects(row.experience,['role','company','period','desc']), education:row.educationText ? [{degree:text(row.educationText),institution:'',period:'',status:''}] : objects(row.education,['degree','institution','period','status']),
    skills:strings(row.skills), certifications:strings(row.certifications), languages:objects(row.languages,['lang','level','score']),
  };
}
export function normalizeJob(value) {
  const row = record(value);
  return {id:identifier(row.id), title:text(row.title) || 'No disponible', description:text(row.description), department:text(row.department), location:text(row.location) || 'No disponible', type:text(row.type) || 'No disponible', salary:text(row.salary) || 'N/D', status:text(row.status) || 'unknown', date:text(row.date) || 'No disponible'};
}
export function normalizeInterview(value) {
  const row = record(value);
  const date = text(row.date);
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T12:00:00`) : null;
  const valid = parsed && !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0,10) === date;
  const name = text(row.name) || text(row.candidate?.name);
  return {id:identifier(row.id), name:name || 'No disponible', avatar:initials(name), color:'bg-brand-red', job:text(row.job) || 'No disponible', date:valid ? date : '', day:valid ? parsed.getDate() : null, month:valid ? parsed.getMonth() : null, year:valid ? parsed.getFullYear() : null, time:text(row.time) || 'N/D', duration:text(row.duration) || 'N/D', type:text(row.type) || 'No disponible', location:text(row.location) || 'No disponible', interviewer:text(row.interviewer) || 'No disponible', status:text(row.status) || 'unknown', notes:text(row.notes)};
}
export function normalizeEvaluation(value) {
  const row = record(value);
  const name = text(row.name) || text(row.candidate?.name);
  const states = {aprobado:'passed', en_revision:'review', no_aprobado:'failed'};
  return {id:identifier(row.id), candidateId:row.candidateId == null ? null : identifier(row.candidateId), name:name || 'No disponible', avatar:initials(name), color:'bg-brand-red', job:text(row.job) || 'No disponible', test:text(row.test) || 'No disponible', status:states[row.status] || (['passed','review','failed'].includes(row.status) ? row.status : 'unknown'), score:score(row.score), time:text(row.time) || 'N/D', date:text(row.date) || 'No disponible', details:objects(row.details,['area','score'])};
}
export function normalizeCollection(value, normalize) {
  if (!Array.isArray(value)) return invalid();
  const result = value.map(normalize);
  if (new Set(result.map(row=>row.id)).size !== result.length) return invalid();
  return result;
}
export function normalizeNotification(value) {
  const row=record(value);
  return {id:identifier(row.id), title:text(row.title) || 'Notificación', description:text(row.description)};
}
