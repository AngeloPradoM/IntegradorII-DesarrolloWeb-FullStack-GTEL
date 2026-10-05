import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({configFile:false, envDir:false, server:{middlewareMode:true, hmr:false}});
globalThis.localStorage = {getItem(){return JSON.stringify({token:'test-token'});},setItem(){throw Error('Unexpected storage write');}};
globalThis.fetch = async()=>Response.json([]);
try {
  const api = await server.ssrLoadModule('/src/services/recruiterService.js');
  const {recruiterTransport: transport} = await server.ssrLoadModule('/src/services/recruiterTransport.js');
  const adapters = await server.ssrLoadModule('/src/services/recruiterAdapters.js');
  for (const read of [api.getRecruiterCandidates,api.getRecruiterJobs,api.getRecruiterInterviews,api.getRecruiterEvaluations,api.getRecruiterNotifications]) assert.deepEqual(await read(),[]);
  assert.equal(await api.getRecruiterCandidate('missing'),null);
  const empty = await api.getRecruiterDashboard();
  assert.equal(empty.newApplicants,0);
  globalThis.fetch = async(url,options)=>{assert.ok(url.endsWith('/test/status'));assert.equal(options.headers.Authorization,'Bearer test-token');assert.equal(JSON.parse(options.body).status,'aprobada');return Response.json({id:'test',status:'aprobada'});};
  assert.equal((await api.updateCandidateStatus('test','aprobada')).id,'test');
  globalThis.fetch = async()=>Response.json([]);

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
  console.log('PASS recruiter: empty reads, missing data, malformed responses, errors, derived counts and authenticated writes without local persistence.');
} finally {await server.close();delete globalThis.localStorage;delete globalThis.fetch;}
