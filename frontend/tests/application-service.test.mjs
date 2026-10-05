import assert from 'node:assert/strict';
import { createServer } from 'vite';
globalThis.localStorage={getItem:()=>JSON.stringify({id:11,rol:'CANDIDATO',token:'test-token'}),setItem(){throw Error('Unexpected local persistence');}};
const server=await createServer({configFile:false,envDir:false,server:{middlewareMode:true,hmr:false}});
let calls=0, captured;
globalThis.fetch=async(url,options)=>{calls++;captured={url,options};return Response.json({id:1,status:'recibida'});};
try {
  const api=await server.ssrLoadModule('/src/services/api.js');
  const cv=new File(['%PDF-1.7\nexample\n%%EOF'],'cv.pdf',{type:'application/pdf'});
  const data={personalData:{nombres:'Juan Carlos',apellidos:'De la Cruz',dni:'12345678',email:'candidate@example.test',telefono:'987654321',distrito:'Lima'},cv,termsAccepted:true};
  await assert.rejects(api.createApplication({},data),/Oferta/);
  await assert.rejects(api.createApplication({id:1},{...data,termsAccepted:false}),/términos/);
  assert.equal(calls,0);
  assert.equal((await api.createApplication({id:1},data)).id,1);
  assert.ok(captured.url.endsWith('/api/candidate/applications/1'));
  assert.equal(captured.options.headers.Authorization,'Bearer test-token');
  assert.equal(captured.options.headers['Content-Type'],undefined);
  assert.equal(await captured.options.body.get('cv').text(),await cv.text());
  assert.equal(JSON.parse(await captured.options.body.get('data').text()).telefono,'+51987654321');
  globalThis.fetch=async()=>Response.json({detail:'Ya postulaste'},{status:409});
  await assert.rejects(api.createApplication({id:1},data),/Ya postulaste/);
  globalThis.fetch=async()=>Response.json([{id:1,status:'en_revision'}]);
  assert.equal((await api.getCandidateApplications())[0].status,'reviewing');
  console.log('PASS: multipart PDF, authorization, validation, conflict propagation and API status mapping.');
} finally {await server.close();delete globalThis.localStorage;delete globalThis.fetch;}
