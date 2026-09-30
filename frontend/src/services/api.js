import { demoCollections, writeDemo } from "./demoStore";
import { getJobs } from "../utils/jobsData";
import { getStoredUser } from "../utils/auth";
import { candidateKey, ownApplications, hasApplied } from "../utils/applications";
import { validateApplication } from "../utils/formValidation";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
export const IS_DEMO_MODE = import.meta.env.VITE_DATA_MODE !== "api";
const pause = (value, ms = 250) => new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), ms));
const fail = (message) => Promise.reject(new Error(message));

export async function registerCandidate(data) {
  const rawPhone = String(data.telefono || '').trim().replace(/[\s()-]/g, '');
  const telefono = /^\d{9}$/.test(rawPhone) ? '+51' + rawPhone : rawPhone;
  if (!/^\+[1-9]\d{7,14}$/.test(telefono)) throw new Error('Ingresa un teléfono válido con prefijo internacional.');
  const payload = {
    nombres: String(data.nombres || '').trim(),
    apellidos: String(data.apellidos || '').trim(),
    email: String(data.email || '').trim().toLowerCase(),
    password: data.password,
    telefono,
  };
  let response;
  try {
    // Registration is real regardless of the remaining modules' demo mode.
    // Never attach a demo session token to this public endpoint.
    response = await fetch(API_URL.replace(/\/$/, '') + '/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    throw new Error(error.name === 'TimeoutError'
      ? 'El servidor tardó demasiado. El registro podría haberse completado; comprueba antes de repetirlo.'
      : 'No se pudo conectar con el backend. Comprueba que Spring esté iniciado.', { cause: error });
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.detail || body?.message || (response.status === 409 ? 'Este correo ya está registrado.' : 'El servidor no pudo completar el registro.'));
  if (response.status !== 201 || body?.user?.id == null || body?.user?.email?.toLowerCase() !== payload.email) {
    throw new Error('No se pudo confirmar la respuesta del registro. Comprueba si la cuenta fue creada antes de repetirlo.');
  }
  return body;
}

async function authRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(API_URL.replace(/\/$/, '') + path, {
      ...options, signal: AbortSignal.timeout(15000),
    });
  } catch (cause) {
    throw new Error('No se pudo conectar con el backend. Comprueba que Spring esté iniciado.', { cause });
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.detail || body?.message || 'No se pudo iniciar sesión. Comprueba tus credenciales y el tipo de usuario.');
  return body;
}

export async function loginCandidate(data) {
  const result = await authRequest('/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: String(data.email || '').trim().toLowerCase(), password: data.password }),
  });
  return result?.requiresOtp === false ? requireSession(result) : requireChallenge(result);
}

function requireChallenge(body) {
  if (body?.requiresOtp !== true || body.authenticated !== false || body.token ||
      typeof body.sessionId !== 'string' || !body.sessionId || typeof body.maskedEmail !== 'string' ||
      !Number.isFinite(body.resendAfterSeconds) || body.resendAfterSeconds < 0 ||
      !Number.isFinite(body.expiresInSeconds) || body.expiresInSeconds <= 0) {
    throw new Error('Respuesta de verificación inválida.');
  }
  return body;
}

function requireSession(body) {
  requireProfile(body);
  if (typeof body.token !== 'string' || !body.token ||
      !(body.verified === true || (body.authMethod === 'TEST_PASSWORD' && body.otpSkipped === true))) {
    throw new Error('Respuesta de autenticación inválida.');
  }
  return body;
}

function requireProfile(body) {
  if (body?.authenticated !== true || body.id == null || !body.email || !['CANDIDATO','RECLUTADOR','ADMIN'].includes(body.rol)) {
    throw new Error('Respuesta de autenticación inválida.');
  }
  return body;
}

export async function getCurrentUser(token) {
  return requireProfile(await authRequest('/api/auth/me', { headers: { Authorization: 'Bearer ' + token } }));
}

export async function verifyOtp(sessionId, otp) {
  const result = requireProfile(await authRequest('/api/auth/verify-otp', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, otp }),
  }));
  if (result.verified !== true || typeof result.token !== 'string' || !result.token) throw new Error('No se pudo completar la verificación.');
  return { ...result, demo: false };
}

function publicProfile(user) {
  return Object.fromEntries(['id', 'nombres', 'apellidos', 'email', 'telefono', 'ubicacion', 'localidad', 'correoContacto', 'foto'].map(key => [key, user[key] || '']));
}

export async function saveProfile(currentUser, changes) {
  if (!currentUser?.demo || !IS_DEMO_MODE) throw new Error('La edición de perfil aún no tiene un servicio disponible en el servidor.');
  const users = demoCollections.users();
  const index = users.findIndex(item => currentUser.id ? item.id === currentUser.id : item.email === currentUser.email);
  if (index < 0) throw new Error('No se encontró tu cuenta. Inicia sesión nuevamente.');
  const profile = publicProfile({ ...users[index], ...changes, id: users[index].id });
  if (users.some((item, i) => i !== index && item.email.toLowerCase() === profile.email.toLowerCase())) throw new Error('Este correo ya está registrado.');
  users[index] = { ...users[index], ...profile };
  writeDemo('users', users);
  return profile;
}

export async function resendOtp(sessionId) {
  return requireChallenge(await authRequest('/api/auth/resend-otp', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }),
  }));
}

// Recruiter business data is isolated from candidate demo storage.
export { getRecruiterCandidates, getRecruiterCandidate, getRecruiterJobs, getRecruiterJob, getRecruiterInterviews, getRecruiterEvaluations, getRecruiterDashboard, getRecruiterNotifications, updateCandidateStatus, publishJob, updateRecruiterJob, scheduleRecruiterInterview, createRecruiterEvaluation } from './recruiterService';

export function createApplication(job, data = {}, user = getStoredUser()) {
  if (!IS_DEMO_MODE) return fail('Enviar postulaciones todavía no está disponible en modo API.');
  const actualJob = getJobs().find(item => String(item.id) === String(job?.id));
  if (!actualJob) return fail('Oferta no encontrada.');
  const errors = validateApplication(data.personalData || {}, data.cv, data.termsAccepted);
  if (Object.keys(errors).length) return fail(Object.values(errors)[0]);
  const applications = demoCollections.applications();
  if (hasApplied(applications, user, actualJob.id)) return fail('Ya postulaste a esta oferta.');
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const item = { id, candidateId: candidateKey(user), jobId: actualJob.id, job: actualJob.title, company: 'GTEL Telecomunicaciones', createdAt, date: new Date(createdAt).toLocaleDateString('es-PE'), status: 'recibida', location: actualJob.location,
    code: `GTEL-${id}`, personalData: { ...data.personalData },
    cv: { name: data.cv.name, type: data.cv.type, size: data.cv.size, lastModified: data.cv.lastModified }, termsAccepted: true };
  writeDemo("applications", [item, ...applications]); return pause(item);
}
export const getCandidateApplications = (user = getStoredUser()) => {
  if (!IS_DEMO_MODE) return fail('Consultar postulaciones todavía no está disponible en modo API.');
  return pause(ownApplications(demoCollections.applications(), user));
};
