import { jsonRequest, request } from './workflowService';

const endpoint = id => `/api/production-incidents/${encodeURIComponent(id)}`;
const reportPath = (resource, filters = {}) => {
  const params = new URLSearchParams();
  for (const [key,value] of Object.entries(filters)) if (value && value !== 'all') params.set(key, value);
  const query = params.toString();
  return `/api/production-incidents/${resource}${query ? `?${query}` : ''}`;
};

export const listProductionIncidents = signal => request('/api/production-incidents', { signal });
export const listProductionIncidentControl = signal => request('/api/production-incidents/control', { signal });
export const listMyReportedProductionIncidents = signal => request('/api/production-incidents/reported-by-me', { signal });
export const listProductionIncidentsLinkedToMyTickets = signal => request('/api/production-incidents/linked-to-my-tickets', { signal });
export const getProductionIncidentConfiguration = signal => request('/api/production-incidents/configuration', { signal });
export const getProductionIncidentIndicators = (filters, signal) => request(reportPath('indicators', filters), { signal });
export const mergeProductionIncidentControl = (incidents, controlRows) => {
  const controlById = new Map((Array.isArray(controlRows) ? controlRows : []).map(row => [row.id, row]));
  return (Array.isArray(incidents) ? incidents : []).map(incident => {
    const control = controlById.get(incident.id);
    if (!control) return incident;
    return {
      ...incident,
      reportChannel: control.reportChannel ?? incident.reportChannel,
      reporterDetail: control.reporterDetail ?? incident.reporterDetail,
      registeredById: control.registeredById ?? incident.registeredById,
      registeredByEmail: control.registeredByEmail ?? incident.registeredByEmail,
      controlReporter: control.reporter,
      controlCategory: control.category,
      controlResponsible: control.responsible,
      attentionHours: control.attentionHours,
      resolutionHours: control.resolutionHours,
      timeLimitHours: control.timeLimitHours,
      overdue: control.overdue,
      causeAndLearning: control.causeAndLearning,
    };
  });
};
export const exportProductionIncidentReport = filters => request(reportPath('export', filters), { blob: true });
export const saveProductionIncidentWorkbook = blob => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `incidentes-produccion-${new Date().toISOString().slice(0,10)}.xlsx`;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
export const getProductionIncident = (id, signal) => request(endpoint(id), { signal });
export const createProductionIncident = data => jsonRequest('/api/production-incidents', 'POST', data);
export const classifyProductionIncident = (id, data) => jsonRequest(`${endpoint(id)}/classification`, 'PATCH', data);
export const assignProductionIncident = (id, data) => jsonRequest(`${endpoint(id)}/assignment`, 'PATCH', data);
export const addProductionIncidentActivity = (id, data) => jsonRequest(`${endpoint(id)}/activities`, 'POST', data);
export const updateProductionIncidentResolution = (id, data) => jsonRequest(`${endpoint(id)}/resolution`, 'PATCH', data);
export const escalateProductionIncident = (id, data) => jsonRequest(`${endpoint(id)}/escalations`, 'POST', data);
export const resolveProductionIncidentEscalation = (id, escalationId, data) =>
  jsonRequest(`${endpoint(id)}/escalations/${encodeURIComponent(escalationId)}/resolve`, 'PATCH', data);
export const transitionProductionIncident = (id, data) => jsonRequest(`${endpoint(id)}/status`, 'PATCH', data);
export const linkProductionIncidentTicket = (id, ticketId, relationship) =>
  jsonRequest(`${endpoint(id)}/tickets/${encodeURIComponent(ticketId)}`, 'POST', { relationship });
export const unlinkProductionIncidentTicket = (id, ticketId) =>
  request(`${endpoint(id)}/tickets/${encodeURIComponent(ticketId)}`, { method: 'DELETE' });
export const linkProductionIncidentChange = (id, changeId, purpose) =>
  jsonRequest(`${endpoint(id)}/changes/${encodeURIComponent(changeId)}`, 'POST', { purpose });
export const unlinkProductionIncidentChange = (id, changeId) =>
  request(`${endpoint(id)}/changes/${encodeURIComponent(changeId)}`, { method: 'DELETE' });
