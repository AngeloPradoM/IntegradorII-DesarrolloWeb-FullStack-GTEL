export class CandidateServiceError extends Error {
  constructor(message, code = 'UNAVAILABLE') {
    super(message);
    this.name = 'CandidateServiceError';
    this.code = code;
  }
}

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL ? import.meta.env.VITE_API_URL : 'http://localhost:8080').replace(/\/$/, '');

function getStoredToken() {
  try {
    const raw = typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function'
      ? localStorage.getItem('gtel-user')
      : null;
    return raw ? JSON.parse(raw)?.token : null;
  } catch {
    return null;
  }
}

async function candidateFetch(endpoint, options = {}) {
  const token = options.token || getStoredToken();
  if (!token) {
    throw new CandidateServiceError('Inicia sesión como candidato para realizar esta acción.', 'UNAUTHORIZED');
  }

  const url = API_BASE + endpoint;
  let response;
  try {
    const isFormData = options.body instanceof FormData;
    const headers = {
      Authorization: `Bearer ${token}`,
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {})
    };

    response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new CandidateServiceError('No se pudo conectar con el servidor de GTEL.', 'NETWORK_ERROR');
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => null);
    const msg = errData?.detail || errData?.message || (response.status === 409 ? 'Ya has postulado a esta convocatoria.' : 'Error al procesar la solicitud.');
    const error = new CandidateServiceError(msg, errData?.code || 'HTTP_' + response.status);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export const candidateTransport = {
  submitApplication: async ({ formData, token, signal }) => candidateFetch('/api/candidate/applications', {
    method: 'POST',
    body: formData,
    token,
    signal
  }),

  getMyApplications: async ({ token, signal } = {}) => candidateFetch('/api/candidate/applications', {
    method: 'GET',
    token,
    signal
  }),

  getMyApplication: async ({ id, token, signal }) => candidateFetch(`/api/candidate/applications/${id}`, {
    method: 'GET',
    token,
    signal
  }),

  getCvBlobUrl: async (filename, token = getStoredToken()) => {
    const url = API_BASE + `/api/candidate/cv/${encodeURIComponent(filename)}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new CandidateServiceError('No se pudo descargar el CV.');
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }
};
