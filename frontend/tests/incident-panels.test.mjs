import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(path, import.meta.url), 'utf8');
const [adminPage,techPage,adminPanel,techPanel,recruiterPage,incidentService,createForm,indicators] = await Promise.all([
  read('../src/pages/support/AdminTicketsPage.jsx'), read('../src/pages/support/TechnicianTicketsPage.jsx'),
  read('../src/pages/support/AdminIncidentPanel.jsx'), read('../src/pages/support/TechnicianIncidentPanel.jsx'),
  read('../src/pages/support/RecruiterTicketsPage.jsx'), read('../src/services/incidentService.js'),
  read('../src/components/support/IncidentCreateForm.jsx'),
  read('../src/components/support/IncidentIndicators.jsx'),
]);

assert.match(adminPage,/AdminIncidentPanel/);
assert.match(adminPage,/queue==='incidents'/);
assert.match(techPage,/TechnicianIncidentPanel/);
assert.match(techPage,/id="incidents-panel"/);
assert.match(adminPanel,/expectedVersion:selected\.version/);
assert.match(techPanel,/expectedVersion:selected\.version/);
assert.match(adminPanel,/getProductionIncidentConfiguration/);
assert.match(techPanel,/getProductionIncidentConfiguration/);
assert.match(adminPage,/Control de Incidentes/);
assert.match(techPage,/Control de Incidentes/);
assert.match(adminPanel,/responsibleFilter/);
assert.match(adminPanel,/fromDate/);
assert.match(adminPanel,/toDate/);
assert.match(adminPanel,/incidentDisplayStatusLabels/);
assert.match(techPanel,/incidentDisplayStatusLabels/);
assert.match(adminPanel,/resolveProductionIncidentEscalation/);
assert.match(adminPanel,/SlaSection/);
assert.match(adminPanel,/Tiempo hasta atención/);
assert.match(adminPanel,/Tiempo hasta recuperación/);
assert.match(adminPanel,/problemName/);
assert.match(adminPanel,/Reportado por/);
assert.match(adminPanel,/Registrado/);
assert.match(techPanel,/escalateProductionIncident/);
assert.match(techPanel,/updateProductionIncidentResolution/);
assert.match(recruiterPage,/incidentProblemTypes/);
assert.match(recruiterPage,/attentionType:mode/);
assert.match(recruiterPage,/listProductionIncidentsLinkedToMyTickets/);
assert.match(recruiterPage,/Incidentes operativos relacionados/);
assert.match(incidentService,/linked-to-my-tickets/);
assert.match(adminPanel,/getProductionIncidentIndicators/);
assert.match(techPanel,/getProductionIncidentIndicators/);
assert.match(adminPanel,/exportProductionIncidentReport/);
assert.match(techPanel,/exportProductionIncidentReport/);
assert.match(indicators,/averageAttentionHours/);
assert.match(indicators,/averageResolutionHours/);
assert.match(indicators,/repeatedFailures/);
assert.match(indicators,/Indicadores no disponibles/);
assert.match(adminPanel,/linkProductionIncidentTicket/);
assert.match(adminPanel,/linkProductionIncidentChange/);
assert.match(techPanel,/technicalIncidentTransitions/);
assert.match(createForm,/confirmDistinctIncident/);
assert.match(createForm,/moduleCode/);
assert.match(createForm,/incidentTypeCode/);
assert.match(createForm,/problemTypes/);
assert.match(createForm,/Recuperación real/);
assert.match(createForm,/MONITOREO/);
assert.match(createForm,/serviceBlocked/);
assert.match(createForm,/repeatedFailure/);
for (const source of [adminPanel,techPanel,createForm,indicators]) {
  assert.match(source,/bg-app-(surface|muted|action)/);
  assert.match(source,/text-app-(primary|body|secondary)/);
  assert.doesNotMatch(source,/mock|fixture|demo incident/i);
}
console.log('PASS incident panels: existing queues, concurrency, relationships and theme tokens.');
