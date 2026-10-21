import assert from 'node:assert/strict';
import { createServer } from 'vite';

const storage = new Map();
globalThis.localStorage = { getItem:key=>storage.get(key) || null, setItem:(key,value)=>storage.set(key,String(value)), removeItem:key=>storage.delete(key) };
const server = await createServer({configFile:false,envDir:false,server:{middlewareMode:true},define:{'import.meta.env.VITE_DATA_MODE':'"mock"'}});
try {
  const api = await server.ssrLoadModule('/src/services/api.js');
  const a={id:'candidate-a',rol:'CANDIDATO',token:crypto.randomUUID()};
  const b={id:'candidate-b',rol:'CANDIDATO',token:crypto.randomUUID()};
  const cv=new File(['%PDF-test'],'cv.pdf',{type:'application/pdf'});
  const data={personalData:{nombres:'Juan Carlos',apellidos:'De la Cruz',dni:'12345678',email:'candidate@example.test',telefono:'987654321'},cv,termsAccepted:true};
  await assert.rejects(api.createApplication({id:'missing'},data,a),/Oferta no encontrada/);
  await assert.rejects(api.createApplication({id:1},{...data,termsAccepted:false},a),/términos/);
  const receipt=await api.createApplication({id:1},data,a);
  assert.equal(receipt.personalData.nombres,data.personalData.nombres);
  assert.deepEqual(Object.keys(receipt.cv).sort(),['lastModified','name','size','type']);
  assert.equal((await api.getCandidateApplications(b)).length,0);
  await api.createApplication({id:1},data,b);
  assert.equal((await api.getCandidateApplications(a)).length,1);
  assert.equal((await api.getCandidateApplications(b)).length,1);
  await assert.rejects(api.createApplication({id:1},data,a),/Ya postulaste/);
  const persisted=JSON.parse(storage.get('gtel-demo-v2-applications'));
  assert.equal(persisted.find(item=>item.id===receipt.id).cv.name,'cv.pdf');
  assert.equal(receipt.cv instanceof File,false);
  console.log('PASS: actual application service, ownership, duplicates, invalid job, terms and CV metadata persistence.');
} finally { await server.close(); delete globalThis.localStorage; }
