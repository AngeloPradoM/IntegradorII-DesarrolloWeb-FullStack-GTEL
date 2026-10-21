export const DEMO_OTP = "123456";

export const mockUsers = [
  { id: "candidate-demo", nombres: "Luis", apellidos: "Rodríguez", email: "candidato@gtel.com", password: "Demo123!", telefono: "+51987654321", rol: "CANDIDATO" },
  { id: "recruiter-demo", nombres: "María", apellidos: "Torres", email: "reclutador@gtel.com", password: "Demo123!", telefono: "+51911222333", rol: "RECLUTADOR" },
];

export const mockCandidates = [
  { id: 1, name: "Ana Torres", email: "ana.torres@email.com", phone: "987 432 110", job: "Asesor de Ventas Telefónicas", date: "24/09/2026", status: "en_revision", score: 86 },
  { id: 2, name: "Carlos Mendoza", email: "carlos@email.com", phone: "966 521 880", job: "Soporte Técnico Nivel 1", date: "23/09/2026", status: "entrevista", score: 92 },
  { id: 3, name: "Lucía Ramos", email: "lucia@email.com", phone: "955 398 214", job: "Supervisor de Call Center", date: "22/09/2026", status: "aprobada", score: 95 },
  { id: 4, name: "Diego Salazar", email: "diego@email.com", phone: "944 126 390", job: "Asesor de Ventas Telefónicas", date: "21/09/2026", status: "recibida", score: 74 },
  { id: 5, name: "Valeria Ponce", email: "valeria@email.com", phone: "933 764 205", job: "Soporte Técnico Nivel 1", date: "20/09/2026", status: "rechazada", score: 58 },
];

export const mockInterviews = [
  { id: 1, name: "Carlos Mendoza", job: "Soporte Técnico Nivel 1", day: 19, month: 4, year: 2026, time: "10:00", duration: "30 min", type: "video", avatar: "CM", color: "bg-blue-600" },
  { id: 2, name: "Ana Torres", job: "Asesor de Ventas Telefónicas", day: 19, month: 4, year: 2026, time: "15:30", duration: "45 min", type: "presencial", avatar: "AT", color: "bg-brand-red" },
  { id: 3, name: "Lucía Ramos", job: "Supervisor de Call Center", day: 21, month: 4, year: 2026, time: "09:00", duration: "45 min", type: "video", avatar: "LR", color: "bg-green-600" },
];

export const mockEvaluations = [
  { id: 1, candidateId: 3, name: "Lucía Ramos", job: "Supervisor de Call Center", test: "Habilidades comerciales", score: 95, time: "22 min", date: "23 Sep 2026", status: "aprobado", details: [{ area: "Comunicación", score: 96 }, { area: "Negociación", score: 94 }] },
  { id: 2, candidateId: 2, name: "Carlos Mendoza", job: "Soporte Técnico Nivel 1", test: "Soporte y resolución", score: 88, time: "28 min", date: "22 Sep 2026", status: "aprobado", details: [{ area: "Diagnóstico", score: 91 }, { area: "Atención", score: 85 }] },
  { id: 3, candidateId: 1, name: "Ana Torres", job: "Asesor de Ventas Telefónicas", test: "Comunicación efectiva", score: 76, time: "25 min", date: "21 Sep 2026", status: "en_revision", details: [{ area: "Claridad", score: 80 }, { area: "Escucha", score: 72 }] },
  { id: 4, candidateId: 4, name: "Diego Salazar", job: "Asesor de Ventas Telefónicas", test: "Habilidades comerciales", score: 48, time: "30 min", date: "20 Sep 2026", status: "no_aprobado", details: [{ area: "Comunicación", score: 55 }, { area: "Negociación", score: 41 }] },
];

export const mockApplications = [
  { id: 1, job: "Asesor de Ventas Telefónicas", company: "GTEL Telecomunicaciones", date: "18 Sep 2026", status: "en_revision", location: "Lima, Perú" },
  { id: 2, job: "Soporte Técnico Nivel 1", company: "GTEL Telecomunicaciones", date: "12 Sep 2026", status: "entrevista", location: "Remoto", interview: "25 Sep 2026, 10:00" },
];
