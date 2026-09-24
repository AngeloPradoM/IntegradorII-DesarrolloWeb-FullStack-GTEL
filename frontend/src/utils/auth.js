export const AUTH_STORAGE_KEY = "gtel-user";

export function getSafeAuthRedirect(value) {
  return typeof value === "string" && /^\/(postulacion(?:\/\d+)?|mis-postulaciones|perfil|contactar-reclutador|candidato)$/.test(value) ? value : null;
}

export function getStoredUser() {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredUser() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getDefaultRouteForRole(role) {
  if (role === "RECLUTADOR") return "/reclutador/dashboard";
  return "/mis-postulaciones";
}
