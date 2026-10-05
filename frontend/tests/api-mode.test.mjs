import assert from 'node:assert/strict';
import { createServer } from 'vite';
const server = await createServer({configFile:false,envDir:false,server:{middlewareMode:true,hmr:false},define:{'import.meta.env.VITE_DATA_MODE':'"mock"'}});
let mutations=0, calls=0;
globalThis.localStorage={getItem:()=>null,setItem:()=>{mutations++;},removeItem:()=>{mutations++;}};
globalThis.fetch=async()=>{calls++;return Response.json([]);};
try {
  const api=await server.ssrLoadModule('/src/services/api.js');
  const workflow=await server.ssrLoadModule('/src/services/workflowService.js');
  assert.equal(api.IS_DEMO_MODE,false);
  await assert.rejects(api.getCandidateApplications(),/Inicia/);
  await assert.rejects(api.saveProfile({},{}),/Inicia/);
  assert.equal(calls,0);
  assert.deepEqual(await workflow.listPublicJobs(),[]);
  globalThis.fetch=async()=>{throw Error('offline');};
  await assert.rejects(workflow.listPublicJobs(),/servidor/);
  assert.equal(mutations,0);
  console.log('PASS: API mode, authentication required, public jobs and no demo fallback.');
} finally {await server.close();delete globalThis.localStorage;delete globalThis.fetch;}
