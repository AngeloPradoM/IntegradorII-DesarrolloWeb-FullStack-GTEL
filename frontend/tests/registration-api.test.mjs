import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({configFile:false,envDir:false,server:{middlewareMode:true,hmr:false},define:{'import.meta.env.VITE_DATA_MODE':'"demo"'}});
const originalFetch = globalThis.fetch;
globalThis.localStorage = {getItem(){throw Error('Registration must not access demo storage');},setItem(){throw Error('Registration must not write demo storage');}};
try {
  const {registerCandidate,IS_DEMO_MODE} = await server.ssrLoadModule('/src/services/api.js');
  assert.equal(IS_DEMO_MODE,true);
  const input={nombres:' Ana ',apellidos:' Perez ',email:' ANA@EXAMPLE.TEST ',telefono:'987654321',password:'fixture-only',ubicacion:'Lima',rol:'RECLUTADOR'};
  let calls=0;
  globalThis.fetch=async(url,options)=>{
    calls++;
    assert.match(url,/\/api\/auth\/register$/);
    assert.equal(options.method,'POST');
    assert.equal(options.headers.Authorization,undefined);
    assert.deepEqual(JSON.parse(options.body),{nombres:'Ana',apellidos:'Perez',email:'ana@example.test',telefono:'+51987654321',password:'fixture-only'});
    return new Response(JSON.stringify({message:'Cuenta creada',user:{id:7,email:'ana@example.test'}}),{status:201});
  };
  assert.equal((await registerCandidate(input)).user.id,7);
  await registerCandidate({...input,telefono:'+51987654321'});
  assert.equal(calls,2);
  await assert.rejects(registerCandidate({...input,telefono:'bad'}),/teléfono/);
  assert.equal(calls,2);
  globalThis.fetch=async()=>new Response(JSON.stringify({detail:'Ese correo ya está registrado'}),{status:409});
  await assert.rejects(registerCandidate(input),/registrado/);
  globalThis.fetch=async()=>{throw TypeError('Failed to fetch');};
  await assert.rejects(registerCandidate(input),/conectar con el backend/);
  globalThis.fetch=async()=>new Response('<html>Wrong server</html>',{status:200});
  await assert.rejects(registerCandidate(input),/confirmar la respuesta/);
  console.log('PASS registration: real HTTP contract even in demo mode, no local persistence, normalized phone, duplicate/network/malformed errors.');
} finally {globalThis.fetch=originalFetch;delete globalThis.localStorage;await server.close();}
