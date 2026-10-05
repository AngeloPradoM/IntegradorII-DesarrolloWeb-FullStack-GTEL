import { request, jsonRequest } from './workflowService';
import { validateApplication } from '../utils/formValidation';
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
export const IS_DEMO_MODE = false;

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
  if (!response.ok) { const error = new Error(body?.detail || body?.message || 'No se pudo comprobar la sesión. Inténtalo nuevamente.'); error.status = response.status; throw error; }
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

export async function saveProfile(_currentUser, changes) {
  return jsonRequest('/api/profile','PUT',changes);
}

export async function resendOtp(sessionId) {
  return requireChallenge(await authRequest('/api/auth/resend-otp', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }),
  }));
}

// Recruiter business data is isolated from candidate demo storage.
export { getRecruiterCandidates, getRecruiterCandidate, getRecruiterJobs, getRecruiterJob, getRecruiterInterviews, getRecruiterEvaluations, getRecruiterDashboard, getRecruiterNotifications, updateCandidateStatus, publishJob, updateRecruiterJob, scheduleRecruiterInterview, createRecruiterEvaluation } from './recruiterService';

export async function createApplication(job, data = {}) {
  const errors=validateApplication(data.personalData||{},data.cv,data.termsAccepted);
  if(Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
  if(!job?.id) throw new Error('Oferta no encontrada.');
  const body=new FormData();
  const personalData = Object.fromEntries(['nombres','apellidos','dni','telefono','distrito','motivacion'].map(key=>[key,String(data.personalData[key]||'').trim()]));
  personalData.telefono = personalData.telefono.replace(/[\s()-]/g,'');
  if (/^\d{9}$/.test(personalData.telefono)) personalData.telefono = '+51' + personalData.telefono;
  body.append('data',new Blob([JSON.stringify(personalData)],{type:'application/json'}));
  body.append('cv',data.cv);body.append('terms',String(data.termsAccepted));
  return request('/api/candidate/applications/'+encodeURIComponent(job.id),{method:'POST',body});
}
export async function getCandidateApplications() {
  const rows=await request('/api/candidate/applications');
  const states={en_revision:'reviewing',entrevista:'interview',aprobada:'approved',rechazada:'rejected'};
  return rows.map(r=>({...r,status:states[r.status]||r.status,company:'GTEL',appliedDate:String(r.date||'').slice(0,10),steps:(r.steps||[]).map(s=>({...s,rejected:s.label==='rechazada'}))}));
}
