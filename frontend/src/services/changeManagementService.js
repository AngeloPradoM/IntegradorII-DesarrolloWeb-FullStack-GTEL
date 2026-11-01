import { jsonRequest, request } from './workflowService';

const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const listChangeRequests = signal => request('/api/change-management/requests', { signal });

export const createChangeRequest = (data, document) => {
  const body = new FormData();
  body.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
  body.append('document', document);
  return request('/api/change-management/requests', { method: 'POST', body });
};

export const downloadChangeTemplate = async () => {
  const blob = await request('/api/change-management/template', { blob: true });
  triggerDownload(blob, 'Formato_RFC.docx');
};

export const downloadChangeDocument = async change => {
  const blob = await request(`/api/change-management/requests/${encodeURIComponent(change.id)}/document`, { blob: true });
  triggerDownload(blob, change.documentName || `${change.code}.docx`);
};

export const assignChangeRequest = (id, technicianId) =>
  jsonRequest(`/api/change-management/requests/${encodeURIComponent(id)}/assignment`, 'PATCH', { technicianId });

export const submitChangeTechnicalReview = (id, data) =>
  jsonRequest(`/api/change-management/requests/${encodeURIComponent(id)}/technical-review`, 'PUT', data);

export const decideChangeRequest = (id, data) =>
  jsonRequest(`/api/change-management/requests/${encodeURIComponent(id)}/decision`, 'PATCH', data);

export const registerChangeExecution = (id, data) =>
  jsonRequest(`/api/change-management/requests/${encodeURIComponent(id)}/execution`, 'PUT', data);

export const validateChangeExecution = (id, data) =>
  jsonRequest(`/api/change-management/requests/${encodeURIComponent(id)}/validation`, 'PATCH', data);
