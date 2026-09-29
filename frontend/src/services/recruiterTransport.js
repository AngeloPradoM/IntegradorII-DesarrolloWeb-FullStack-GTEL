export class RecruiterServiceError extends Error {
  constructor(message, code = 'UNAVAILABLE') { super(message); this.name = 'RecruiterServiceError'; this.code = code; }
}

const pending = async () => { throw new RecruiterServiceError('Esta acción aún no está disponible. No se guardaron cambios.'); };

// Integration boundary: replace these operations only after backend contracts are confirmed.
// Empty reads are intentional; this module never reads demo business data or localStorage.
// Future implementations receive { signal } and must return parsed data or throw an error with status.
export const recruiterTransport = {
  candidates: async () => [],
  jobs: async () => [],
  interviews: async () => [],
  evaluations: async () => [],
  notifications: async () => [],
  publishJob: pending,
  updateJob: pending,
  updateCandidateStatus: pending,
  scheduleInterview: pending,
  createEvaluation: pending,
};
