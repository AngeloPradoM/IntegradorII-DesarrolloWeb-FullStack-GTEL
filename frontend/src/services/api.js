import { DEMO_OTP } from "../mocks/mockData";
import { demoCollections, writeDemo } from "./demoStore";
import { getJobs } from "../utils/jobsData";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
export const IS_DEMO_MODE = import.meta.env.VITE_DATA_MODE !== "api";
const sessions = new Map();
const pause = (value, ms = 250) => new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), ms));
const fail = (message) => Promise.reject(new Error(message));
const maskPhone = (phone = "") => `+51 ******${phone.replace(/\D/g, "").slice(-3)}`;

async function request(path, options = {}) {
  const token = JSON.parse(localStorage.getItem("gtel-user") || "null")?.token;
  const response = await fetch(`${API_URL}${path}`, { headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...options });
  const body = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.detail || body?.message || "No se pudo completar la solicitud");
  return body;
}

export async function registerCandidate(data) {
  if (!IS_DEMO_MODE) return request("/api/auth/register", { method: "POST", body: JSON.stringify(data) });
  const users = demoCollections.users();
  if (users.some((user) => user.email.toLowerCase() === data.email.trim().toLowerCase())) return fail("Este correo ya está registrado");
  const phone = `${data.countryCode || "+51"}${String(data.telefono || "").replace(/\D/g, "")}`;
  writeDemo("users", [...users, { ...data, id: `candidate-${Date.now()}`, telefono: phone, rol: "CANDIDATO" }]);
  return pause({ registered: true });
}

export async function loginCandidate(data) {
  if (!IS_DEMO_MODE) return request("/api/auth/login", { method: "POST", body: JSON.stringify(data) });
  const user = demoCollections.users().find((item) => item.email.toLowerCase() === data.email.trim().toLowerCase() && item.rol === data.rol);
  if (!user || user.password !== data.password) return fail("Correo, contraseña o tipo de usuario incorrectos");
  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, { user, expiresAt: Date.now() + 5 * 60_000, attempts: 0, resends: 0 });
  return pause({ requiresOtp: true, sessionId, maskedPhone: maskPhone(user.telefono), resendAfterSeconds: 30, expiresInSeconds: 300, demo: true });
}

export async function verifyOtp(sessionId, otp) {
  if (!IS_DEMO_MODE) return request("/api/auth/verify-otp", { method: "POST", body: JSON.stringify({ sessionId, otp }) });
  const session = sessions.get(sessionId);
  if (!session) return fail("La sesión ya no es válida. Inicia sesión nuevamente.");
  if (Date.now() > session.expiresAt) return fail("El código ha expirado. Solicita uno nuevo.");
  session.attempts += 1;
  if (session.attempts > 5) return fail("Se agotaron los intentos. Inicia sesión nuevamente.");
  if (otp !== DEMO_OTP) return fail("Código incorrecto. En modo demo usa 123456.");
  const { user } = session;
  sessions.delete(sessionId);
  return pause({ verified: true, token: `demo-session:${user.rol}:${user.id}`, email: user.email, role: user.rol, nombres: user.nombres, demo: true });
}

export async function resendOtp(sessionId) {
  if (!IS_DEMO_MODE) return request("/api/auth/resend-otp", { method: "POST", body: JSON.stringify({ sessionId }) });
  const session = sessions.get(sessionId);
  if (!session) return fail("La sesión ya no es válida. Inicia sesión nuevamente.");
  if (session.resends >= 3) return fail("Alcanzaste el límite de reenvíos de esta sesión.");
  session.resends += 1; session.expiresAt = Date.now() + 5 * 60_000; session.attempts = 0;
  return pause({ requiresOtp: true, sessionId, maskedPhone: maskPhone(session.user.telefono), resendAfterSeconds: 30, expiresInSeconds: 300, demo: true });
}

export const getRecruiterCandidates = () => IS_DEMO_MODE ? pause(demoCollections.candidates()) : request("/api/recruiter/candidates");
export const getRecruiterInterviews = () => IS_DEMO_MODE ? pause(demoCollections.interviews()) : request("/api/recruiter/interviews");
export const getRecruiterEvaluations = () => IS_DEMO_MODE ? pause(demoCollections.evaluations()) : request("/api/recruiter/evaluations");
export function getRecruiterDashboard() {
  if (!IS_DEMO_MODE) return request("/api/recruiter/dashboard");
  const candidates = demoCollections.candidates();
  return pause({ newApplicants: candidates.length, scheduledInterviews: demoCollections.interviews().length, activeJobs: getJobs().length, recentApplications: candidates.slice(0, 5), applicationsByArea: [{ name: "Ventas", value: 45 }, { name: "Soporte", value: 30 }, { name: "Supervisión", value: 25 }] });
}
export function updateCandidateStatus(id, status) {
  const candidates = demoCollections.candidates().map((item) => String(item.id) === String(id) ? { ...item, status } : item);
  writeDemo("candidates", candidates); return pause(candidates.find((item) => String(item.id) === String(id)));
}
export function createApplication(job) {
  const applications = demoCollections.applications();
  if (applications.some((item) => String(item.id) === String(job.id))) return fail("Ya postulaste a esta oferta.");
  const item = { id: job.id, job: job.title, company: "GTEL Telecomunicaciones", date: new Date().toLocaleDateString("es-PE"), status: "recibida", location: job.location };
  writeDemo("applications", [item, ...applications]); return pause(item);
}
export const getCandidateApplications = () => pause(demoCollections.applications());
