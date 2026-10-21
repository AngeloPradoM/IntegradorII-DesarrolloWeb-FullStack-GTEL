import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({configFile:false, envDir:false, server:{middlewareMode:true, hmr:false}});
globalThis.localStorage = {getItem(){throw Error('Unexpected storage read');},setItem(){throw Error('Unexpected storage write');}};
try {
  const api = await server.ssrLoadModule('/src/services/recruiterService.js');
  const {recruiterTransport: transport} = await server.ssrLoadModule('/src/services/recruiterTransport.js');
  const adapters = await server.ssrLoadModule('/src/services/recruiterAdapters.js');
  for (const read of [api.getRecruiterCandidates,api.getRecruiterJobs,api.getRecruiterInterviews,api.getRecruiterEvaluations,api.getRecruiterNotifications]) assert.deepEqual(await read(),[]);
  assert.equal(await api.getRecruiterCandidate('missing'),null);
  const empty = await api.getRecruiterDashboard();
  assert.equal(empty.newApplicants,0);
  await assert.rejects(api.updateCandidateStatus('test','approved'),/No se guardaron cambios/);
  await assert.rejects(api.publishJob({title:'Test',type:'Full Time',location:'Test',description:'Test',department:'Test',vacancies:1,salaryMin:0,salaryMax:1}),/No se guardaron cambios/);
  const row = adapters.normalizeCandidate({id:'test',skills:null,experience:null});
  assert.equal(row.score,null); assert.equal(row.status,'unknown'); assert.deepEqual(row.skills,[]);
  assert.throws(()=>adapters.normalizeCollection([{id:1},{id:1}],adapters.normalizeCandidate),/interpretar/);
  transport.candidates = async()=>[{id:'test',department:'Test'}];
  assert.equal((await api.getRecruiterDashboard()).newApplicants,1);
  assert.deepEqual((await api.getRecruiterDashboard()).applicationsByArea,[{name:'Test',value:1}]);
  transport.candidates = async()=>null;
  await assert.rejects(api.getRecruiterCandidates(),/interpretar/);
  transport.candidates = async()=>{throw {status:403};};
  await assert.rejects(api.getRecruiterCandidates(),/No tienes permiso/);
  transport.candidates = async()=>{throw Error('Private server details');};
  await assert.rejects(api.getRecruiterCandidates(),error=>!error.message.includes('Private') && error.message.includes('Inténtalo'));
  assert.equal(adapters.normalizeInterview({id:'test',date:'2026-02-30'}).date,'');
  transport.dashboard = async()=>({newApplicants:10, activeJobs:3, scheduledInterviews:2, evaluations:1, funnel:{total:10, conversionRate:20, stages:[{key:'recibida', count:5}]}, quickActions:{pendingReviews:4}, topCandidates:[{id:'c1', name:'Test Candidate', score:90}], applicationsByArea:[{name:'IT', value:3}]});
  const serverDash = await api.getRecruiterDashboard();
  assert.equal(serverDash.newApplicants,10);
  assert.equal(serverDash.activeJobs,3);
  assert.equal(serverDash.funnel.conversionRate,20);
  assert.equal(serverDash.quickActions.pendingReviews,4);
  assert.equal(serverDash.topCandidates[0].name,'Test Candidate');
  assert.equal(serverDash.topCandidates[0].score,90);
  console.log('PASS recruiter: empty reads, missing data, malformed responses, errors, derived counts, server dashboard and blocked writes without storage.');
} finally {await server.close();delete globalThis.localStorage;}
