import { getStoredUser } from '../utils/auth';
const base = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');
export async function request(path, { publicAccess = false, ...options } = {}) {
  const token = getStoredUser()?.token;
  if (!publicAccess && !token) throw new Error('Inicia sesión nuevamente.');
  const headers = { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...options.headers };
  if (!publicAccess) headers.Authorization = `Bearer ${token}`;
  let response;
  try { response = await fetch(base + path, { ...options, headers, signal: options.signal || AbortSignal.timeout(20000) }); }
  catch (e) { if (e.name === 'AbortError') throw e; throw new Error('No se pudo conectar con el servidor.', { cause: e }); }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const failure = new Error(error.detail || error.message || ({ 401: 'Tu sesión venció. Inicia sesión nuevamente.', 403: 'No tienes permisos.', 404: 'Registro no disponible.', 413: 'El archivo es demasiado grande.' }[response.status]) || 'No se pudo completar la operación. Revisa los datos.');
    failure.status = response.status;
    failure.userFacing = true;
    throw failure;
  }
  if (options.blob) return response.blob();
  if (response.status === 204) return null;
  return response.json().catch(() => null);
}
export const jsonRequest = (path, method, data, options = {}) => request(path, { ...options, method, body: JSON.stringify(data) });
export const listPublicJobs = () => request('/api/jobs', { publicAccess: true });
export async function downloadCv(id) {
  const blob = await request(`/api/applications/${encodeURIComponent(id)}/cv`, { blob: true });
  const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'curriculum.pdf'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
