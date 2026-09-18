const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.status === 204 ? null : response.json();
}

function collection(payload) {
  if (Array.isArray(payload)) return payload;
  return payload?.content || payload?.data || [];
}

export function getRecruiterCandidates() {
  return request("/api/recruiter/candidates").then(collection);
}

export function getRecruiterInterviews() {
  return request("/api/recruiter/interviews").then(collection);
}

export function getRecruiterEvaluations() {
  return request("/api/recruiter/evaluations").then(collection);
}

export function getRecruiterDashboard() {
  return request("/api/recruiter/dashboard");
}
