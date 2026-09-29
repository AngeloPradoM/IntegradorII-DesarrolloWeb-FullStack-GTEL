import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({ configFile:false, envDir:false, server:{middlewareMode:true}, define:{'import.meta.env.VITE_DATA_MODE':'"api"'} });
let mutations = 0;
globalThis.localStorage = { getItem:()=>null, setItem:()=>{mutations++;}, removeItem:()=>{mutations++;} };
try {
  const api = await server.ssrLoadModule('/src/services/api.js');
  assert.equal(api.IS_DEMO_MODE,false);
  await assert.rejects(api.createApplication({id:1},{},null),/modo API/);
  await assert.rejects(api.getCandidateApplications(null),/modo API/);
  await assert.rejects(api.updateCandidateStatus(1,'aprobada'),/aún no está disponible/);
  await assert.rejects(api.saveProfile({},{}),/servidor/);
  await assert.rejects(api.publishJob({}),/Título/);
  assert.equal(mutations,0);
  console.log('PASS: pending API operations return controlled errors without local writes.');
} finally { await server.close(); delete globalThis.localStorage; }
