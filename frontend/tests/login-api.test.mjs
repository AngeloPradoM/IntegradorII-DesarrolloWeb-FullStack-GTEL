import assert from 'node:assert/strict';
import { createServer } from 'vite';
const server = await createServer({configFile:false,envDir:false,server:{middlewareMode:true,hmr:false},define:{'import.meta.env.VITE_DATA_MODE':'"demo"'}});
const originalFetch=globalThis.fetch;
globalThis.localStorage={getItem(){throw Error('Login must not read demo storage');}};
try {
  const {loginCandidate,getCurrentUser}=await server.ssrLoadModule('/src/services/api.js');
  const profile={id:3,email:'user@example.test',rol:'CANDIDATO',authenticated:true,requiresOtp:false,token:'server-token'};
  globalThis.fetch=async(url,options)=>{
    assert.match(url,/\/api\/auth\/login$/);
    assert.equal(options.headers.Authorization,undefined);
    assert.deepEqual(JSON.parse(options.body),{email:'user@example.test',password:'secret',rol:'CANDIDATO'});
    return Response.json(profile);
  };
  assert.equal((await loginCandidate({email:' USER@example.test ',password:'secret',rol:'CANDIDATO'})).token,'server-token');
  globalThis.fetch=async(url,options)=>{
    assert.match(url,/\/api\/auth\/me$/);
    assert.equal(options.headers.Authorization,'Bearer server-token');
    return Response.json({...profile,rol:'RECLUTADOR'});
  };
  assert.equal((await getCurrentUser('server-token')).rol,'RECLUTADOR');
  globalThis.fetch=async()=>Response.json({detail:'Credenciales incorrectas'},{status:401});
  await assert.rejects(loginCandidate({}),/Credenciales/);
  await assert.rejects(getCurrentUser('expired'),/Credenciales/);
  globalThis.fetch=async()=>Response.json({authenticated:true});
  await assert.rejects(loginCandidate({}),/inv/);
  globalThis.fetch=async()=>{throw new TypeError('offline');};
  await assert.rejects(loginCandidate({}),/backend/);
  console.log('PASS login: real API in demo data mode, payload, session validation, roles, errors; no local fallback.');
} finally {globalThis.fetch=originalFetch;delete globalThis.localStorage;await server.close();}
