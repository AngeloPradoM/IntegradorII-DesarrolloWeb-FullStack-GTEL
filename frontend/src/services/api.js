const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

async function request(path, options = {}) {
  const token = JSON.parse(localStorage.getItem("gtel-user") || "null")?.token;
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail || body.message || "No se pudo completar la solicitud");
  return body;
}

export function registerCandidate(data) {
  return request("/api/auth/register", { method: "POST", body: JSON.stringify(data) });
}

export function loginCandidate(data) {
  return request("/api/auth/login", { method: "POST", body: JSON.stringify(data) });
}

export function getRecruiterCandidates() {
  return request("/api/recruiter/candidates");
}

export function getRecruiterInterviews() {
  return request("/api/recruiter/interviews");
}

export function getRecruiterEvaluations() {
  return request("/api/recruiter/evaluations");
}

export function getRecruiterDashboard() {
  return request("/api/recruiter/dashboard");
}
