export function candidateKey(user) {
  if (!user?.token || user.rol !== 'CANDIDATO') throw new Error('Inicia sesión como candidato.');
  if (user.id) return `id:${user.id}`;
  // Older demo sessions encoded the stable account id in the token.
  const legacyId = user.token.match(/^demo-session:CANDIDATO:(.+)$/)?.[1];
  if (legacyId) return `id:${legacyId}`;
  if (user.email) return `email:${user.email.trim().toLowerCase()}`;
  throw new Error('No se pudo identificar tu cuenta.');
}

export function ownApplications(applications, user) {
  const key = candidateKey(user);
  // Unowned legacy fixtures are deliberately not assigned to any candidate.
  return applications.filter(item => item.candidateId === key);
}

export function hasApplied(applications, user, jobId) {
  return ownApplications(applications, user).some(item => String(item.jobId) === String(jobId));
}

export function applicationFormData(application, file) {
  const payload = new FormData();
  payload.append('application', JSON.stringify(application));
  if (file) payload.append('cv', file, file.name);
  return payload;
}
