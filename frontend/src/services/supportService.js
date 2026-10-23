import { jsonRequest, request } from './workflowService';

export const listSupportTickets = signal => request('/api/support/tickets', { signal });
export const listTechnicians = signal => request('/api/support/technicians', { signal });
export const createSupportTicket = data => jsonRequest('/api/support/tickets', 'POST', data);
export const assignSupportTicket = (id, technicianId) => jsonRequest(`/api/support/tickets/${encodeURIComponent(id)}/assignment`, 'PATCH', { technicianId });
export const updateSupportTicketStatus = (id, status) => jsonRequest(`/api/support/tickets/${encodeURIComponent(id)}/status`, 'PATCH', { status });
export const submitSupportProposal = (id, diagnosis, proposedSolution) => jsonRequest(`/api/support/tickets/${encodeURIComponent(id)}/proposal`, 'PUT', { diagnosis, proposedSolution });
export const decideSupportProposal = (id, approved, comment = '') => jsonRequest(`/api/support/tickets/${encodeURIComponent(id)}/decision`, 'PATCH', { approved, comment });
export const registerSupportExecution = (id, evidence) => jsonRequest(`/api/support/tickets/${encodeURIComponent(id)}/execution`, 'PUT', { evidence });
