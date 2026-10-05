import { request, jsonRequest } from './workflowService';
export class RecruiterServiceError extends Error {
 constructor(message,code='UNAVAILABLE'){super(message);this.name='RecruiterServiceError';this.code=code;}
}
const jobPayload = data => ({...data,
 type:({'Full-Time':'full_time','Part-Time':'part_time','Por turnos':'por_turnos','Freelance':'freelance'}[data.type]||data.type),
 modality:({'Presencial':'presencial','Remoto':'remoto','Híbrido':'hibrido'}[data.modality]||data.modality),
 status:data.status||'activa',deadline:data.deadline||null,vacancies:Number(data.vacancies),salaryMin:Number(data.salaryMin),salaryMax:Number(data.salaryMax)});
export const recruiterTransport = {
 candidates: ({signal}={})=>request('/api/recruiter/applications',{signal}),
 jobs: ({signal}={})=>request('/api/recruiter/jobs',{signal}),
 interviews: ({signal}={})=>request('/api/recruiter/selection/interviews',{signal}),
 evaluations: ({signal}={})=>request('/api/recruiter/selection/evaluations',{signal}),
 notifications: ({signal}={})=>request('/api/notifications',{signal}),
 publishJob: ({data})=>jsonRequest('/api/recruiter/jobs','POST',jobPayload(data)),
 updateJob: ({id,data})=>jsonRequest('/api/recruiter/jobs/'+encodeURIComponent(id),'PUT',jobPayload(data)),
 updateCandidateStatus: ({id,status})=>jsonRequest('/api/recruiter/applications/'+encodeURIComponent(id)+'/status','PUT',{status}),
 scheduleInterview: ({data})=>jsonRequest('/api/recruiter/selection/interviews','POST',data),
 createEvaluation: ({data})=>jsonRequest('/api/recruiter/selection/evaluations','POST',data),
};
