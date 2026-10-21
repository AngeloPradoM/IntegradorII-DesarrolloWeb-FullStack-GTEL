export class RecruiterServiceError extends Error {
  constructor(message, code = 'UNAVAILABLE') {
    super(message);
    this.name = 'RecruiterServiceError';
    this.code = code;
  }
}

const pending = async () => {
  throw new RecruiterServiceError('Esta acción aún no está disponible. No se guardaron cambios.');
};

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL ? import.meta.env.VITE_API_URL : 'http://localhost:8080').replace(/\/$/, '');

function getAuthToken() {
  try {
    const raw = typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function'
      ? localStorage.getItem('gtel-user')
      : null;
    return raw ? JSON.parse(raw)?.token : null;
  } catch {
    return null;
  }
}

async function recruiterFetch(endpoint, options = {}) {
  const token = getAuthToken();
  if (!token) {
    if (options.method && options.method !== 'GET') {
      return pending();
    }
    return [];
  }

  const url = API_BASE + endpoint;
  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      },
      signal: options.signal
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new RecruiterServiceError('No se pudo conectar con el servidor.', 'NETWORK_ERROR');
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => null);
    const msg = errData?.detail || errData?.message || (response.status === 403 ? 'No tienes permiso para consultar esta información.' : 'Error al procesar la solicitud.');
    const error = new RecruiterServiceError(msg, errData?.code || 'HTTP_' + response.status);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const recruiterTransport = {
  candidates: async ({ signal } = {}) => recruiterFetch('/api/recruiter/candidates', { signal }),
  jobs: async ({ signal } = {}) => recruiterFetch('/api/recruiter/jobs', { signal }),
  interviews: async ({ signal } = {}) => recruiterFetch('/api/recruiter/interviews', { signal }),
  evaluations: async ({ signal } = {}) => recruiterFetch('/api/recruiter/evaluations', { signal }),
  notifications: async ({ signal } = {}) => recruiterFetch('/api/notifications', { signal }),
  unreadNotificationCount: async ({ signal } = {}) => recruiterFetch('/api/notifications/unread-count', { signal }),
  markNotificationRead: async ({ id, signal } = {}) => recruiterFetch(`/api/notifications/${id}/read`, { method: 'PUT', signal }),
  markAllNotificationsRead: async ({ signal } = {}) => recruiterFetch('/api/notifications/read-all', { method: 'PUT', signal }),
  departments: async ({ signal } = {}) => recruiterFetch('/api/recruiter/departments', { signal }),
  publishJob: async ({ data, signal } = {}) => recruiterFetch('/api/recruiter/jobs', { method: 'POST', body: JSON.stringify(data), signal }),
  updateJob: async ({ id, data, signal } = {}) => recruiterFetch(`/api/recruiter/jobs/${id}`, { method: 'PUT', body: JSON.stringify(data), signal }),
  updateCandidateStatus: async ({ id, status, comment, signal } = {}) => recruiterFetch(`/api/recruiter/candidates/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, comment }), signal }),
  candidateTimeline: async ({ id, signal } = {}) => recruiterFetch(`/api/recruiter/candidates/${id}/timeline`, { signal }),
  scheduleInterview: async ({ data, signal } = {}) => recruiterFetch('/api/recruiter/interviews', { method: 'POST', body: JSON.stringify(data), signal }),
  createEvaluation: async ({ data, signal } = {}) => recruiterFetch('/api/recruiter/evaluations', { method: 'POST', body: JSON.stringify(data), signal }),
  dashboard: async ({ signal } = {}) => recruiterFetch('/api/recruiter/dashboard', { signal }),
  requirements: async ({ signal } = {}) => recruiterFetch('/api/recruiter/requirements', { signal }),
  createRequirement: async ({ data, signal } = {}) => recruiterFetch('/api/recruiter/requirements', { method: 'POST', body: JSON.stringify(data), signal }),
  updateRequirementStatus: async ({ id, status, observations, signal } = {}) => recruiterFetch(`/api/recruiter/requirements/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, observaciones: observations }), signal }),
};
