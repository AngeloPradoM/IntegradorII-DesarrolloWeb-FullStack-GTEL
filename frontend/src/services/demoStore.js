import { mockApplications, mockCandidates, mockEvaluations, mockInterviews, mockUsers } from "../mocks/mockData";

// Increment when a fixture schema changes so stale browser data cannot break pages.
const prefix = "gtel-demo-v2-";

export function readDemo(key, seed) {
  try {
    const value = localStorage.getItem(prefix + key);
    if (value) return JSON.parse(value);
  } catch { /* use seed */ }
  const initial = structuredClone(seed);
  localStorage.setItem(prefix + key, JSON.stringify(initial));
  return initial;
}

export function writeDemo(key, value) {
  localStorage.setItem(prefix + key, JSON.stringify(value));
  return value;
}

export const demoCollections = {
  users: () => readDemo("users", mockUsers),
  candidates: () => readDemo("candidates", mockCandidates),
  interviews: () => readDemo("interviews", mockInterviews),
  evaluations: () => readDemo("evaluations", mockEvaluations),
  applications: () => readDemo("applications", mockApplications),
};
