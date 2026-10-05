import { useEffect, useState } from 'react';
import { listPublicJobs } from '../services/workflowService';
export default function useJobs() {
  const [state, setState] = useState({ jobs: [], loading: true, error: '' });
  useEffect(() => {
    let active = true;
    listPublicJobs().then(rows => {
      if (!Array.isArray(rows)) throw new Error('No se pudieron interpretar las ofertas.');
      const jobs = rows.map(job => ({ ...job, tags: Array.isArray(job.tags) ? job.tags : [],
        type: ({full_time:'Full-Time',part_time:'Part-Time',por_turnos:'Por turnos',freelance:'Freelance'}[job.type] || job.type),
        posted: job.date ? String(job.date).slice(0,10) : '' }));
      if (active) setState({ jobs, loading: false, error: '' });
    })
      .catch(e => { if (active) setState({ jobs: [], loading: false, error: e.message }); });
    return () => { active = false; };
  }, []);
  return state;
}
