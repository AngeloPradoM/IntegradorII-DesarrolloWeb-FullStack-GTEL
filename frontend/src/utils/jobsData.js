// Datos base de contingencia (fallback offline)
// En operación normal, las ofertas se obtienen directamente de MySQL vía /api/jobs y /api/recruiter/jobs
export const jobs = [
  {
    id: 1,
    title: "Asesor de Ventas Telefónicas Outbound",
    type: "Full-Time",
    isNew: true,
    location: "Lima, Perú",
    salary: "S/ 1,500 - S/ 2,200",
    department: "Ventas y Comercial",
    description: "Buscamos talentos comerciales para contactar clientes potenciales, ofrecer planes corporativos y de telecomunicaciones.",
  },
  {
    id: 2,
    title: "Soporte Técnico Nivel 1 - Mesa de Ayuda",
    type: "Part-Time",
    isNew: false,
    location: "Remoto",
    salary: "S/ 1,800 - S/ 2,500",
    department: "Soporte Técnico e IT",
    description: "Atención de tickets e incidencias técnicas de conectividad de fibra óptica y configuración remota.",
  },
  {
    id: 3,
    title: "Supervisor de Operaciones Call Center",
    type: "Full-Time",
    isNew: true,
    location: "Arequipa, Perú",
    salary: "S/ 2,800 - S/ 3,600",
    department: "Operaciones Call Center",
    description: "Liderar y supervisar equipos de agentes telefónicos, monitorear métricas operativas (AHT, FCR, CSAT).",
  },
];

export function getJobs() {
  return jobs;
}