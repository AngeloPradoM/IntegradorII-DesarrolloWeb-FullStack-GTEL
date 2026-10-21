const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL ? import.meta.env.VITE_API_URL : 'http://localhost:8080').replace(/\/$/, '');

export async function getPublicJobs(params = {}, signal) {
  const query = new URLSearchParams();
  if (params.search && params.search.trim()) query.set('search', params.search.trim());
  if (params.type && params.type !== 'all') query.set('type', params.type);
  if (params.modality && params.modality !== 'all') query.set('modality', params.modality);
  if (params.location && params.location !== 'all') query.set('location', params.location);

  const qs = query.toString();
  const url = `${API_BASE}/api/jobs${qs ? `?${qs}` : ''}`;

  try {
    const response = await fetch(url, {
      signal: signal || AbortSignal.timeout(10000),
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) {
      throw new Error('No se pudieron obtener las ofertas laborales.');
    }
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('No se pudo conectar con el servidor de ofertas laborales.', { cause: error });
  }
}

export async function getPublicJob(id, signal) {
  if (!id) throw new Error('Identificador de oferta requerido.');
  const url = `${API_BASE}/api/jobs/${encodeURIComponent(id)}`;

  try {
    const response = await fetch(url, {
      signal: signal || AbortSignal.timeout(10000),
      headers: { 'Accept': 'application/json' },
    });
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error('No se pudo cargar el detalle de la oferta.');
    }
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('No se pudo conectar con el servidor para obtener la oferta.', { cause: error });
  }
}

export async function getPublicDepartments(signal) {
  const url = `${API_BASE}/api/departments`;
  try {
    const response = await fetch(url, {
      signal: signal || AbortSignal.timeout(10000),
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}
