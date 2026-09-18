export const jobs = [
  {
    id: 1,
    title: "Asesor de Ventas Telefónicas",
    type: "Full-Time",
    isNew: true,
    location: "Lima, Perú",
    salary: "S/ 1,500 - S/ 2,200",
  },
  {
    id: 2,
    title: "Soporte Técnico Nivel 1",
    type: "Part-Time",
    isNew: false,
    location: "Remoto",
    salary: "S/ 1,200 - S/ 1,800",
  },
  {
    id: 3,
    title: "Supervisor de Call Center",
    type: "Full-Time",
    isNew: true,
    location: "Arequipa, Perú",
    salary: "S/ 2,500 - S/ 3,200",
  },
];

const JOBS_STORAGE_KEY = "gtel-jobs";

export function getJobs() {
  const storedJobs = localStorage.getItem(JOBS_STORAGE_KEY);

  if (!storedJobs) {
    return jobs;
  }

  try {
    return [...JSON.parse(storedJobs), ...jobs];
  } catch {
    return jobs;
  }
}

export function addJob(job) {
  const storedJobs = localStorage.getItem(JOBS_STORAGE_KEY);
  const publishedJobs = storedJobs ? JSON.parse(storedJobs) : [];
  const newJob = {
    ...job,
    id: Date.now(),
    isNew: true,
  };

  localStorage.setItem(
    JOBS_STORAGE_KEY,
    JSON.stringify([newJob, ...publishedJobs])
  );
}