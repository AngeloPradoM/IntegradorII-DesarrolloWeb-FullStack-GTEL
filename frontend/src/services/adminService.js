import { getStoredUser } from '../utils/auth';

const base = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');
async function request(path, options = {}) {
  const token = getStoredUser()?.token;
  if (!token) throw new Error('Inicia sesión nuevamente.');
  let response;
  try {
    response = await fetch(base + '/api/admin/users' + path, {
      ...options, signal: options.signal || AbortSignal.timeout(15000),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
  } catch (cause) {
    if (cause.name === 'AbortError') throw cause;
    throw new Error('No se pudo conectar con el servidor.', { cause });
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(response.status === 401 ? 'Tu sesión venció o cambió. Vuelve a ingresar.'
    : response.status === 403 ? 'No tienes permisos de administrador.' : data?.detail || 'No se pudo guardar. Revisa los datos.');
  return data;
}
export function listUsers(search, page, signal) { return request(`?search=${encodeURIComponent(search)}&page=${page}`, { signal }); }
export function saveUser(id, data) { return request(id ? `/${id}` : '', { method: id ? 'PUT' : 'POST', body: JSON.stringify(data) }); }

export function deleteUser(id) { return request("/"+encodeURIComponent(id), { method:"DELETE" }); }
