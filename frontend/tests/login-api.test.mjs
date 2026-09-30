import assert from 'node:assert/strict';
import { createServer } from 'vite';
const server = await createServer({configFile:false,envDir:false,server:{middlewareMode:true,hmr:false},define:{'import.meta.env.VITE_DATA_MODE':'"demo"'}});
const originalFetch=globalThis.fetch;
globalThis.localStorage={getItem(){throw Error('Login must not read demo storage');}};
try {
  const {loginCandidate,getCurrentUser,verifyOtp,resendOtp}=await server.ssrLoadModule('/src/services/api.js');
  const challenge={requiresOtp:true,authenticated:false,sessionId:'challenge-id',maskedEmail:'u***@example.test',resendAfterSeconds:30,expiresInSeconds:300};
  const profile={verified:true,id:3,email:'user@example.test',rol:'CANDIDATO',authenticated:true,requiresOtp:false,token:'server-token'};
  globalThis.fetch=async(url,options)=>{
    assert.match(url,/\/api\/auth\/login$/);
    assert.equal(options.headers.Authorization,undefined);
    assert.deepEqual(JSON.parse(options.body),{email:'user@example.test',password:'secret'});
    return Response.json(challenge);
  };
  assert.equal((await loginCandidate({email:' USER@example.test ',password:'secret',rol:'CANDIDATO'})).sessionId,'challenge-id');
  globalThis.fetch=async()=>Response.json({...profile,verified:false});
  await assert.rejects(loginCandidate({}),/inv/);
  globalThis.fetch=async()=>Response.json({...profile,rol:'ADMIN',verified:false,authMethod:'TEST_PASSWORD',otpSkipped:true});
  assert.equal((await loginCandidate({})).rol,'ADMIN');
  globalThis.fetch=async(url,options)=>{
    assert.match(url,/\/api\/auth\/verify-otp$/);
    assert.equal(options.headers.Authorization,undefined);
    assert.deepEqual(JSON.parse(options.body),{sessionId:'challenge-id',otp:'654321'});
    return Response.json(profile);
  };
  assert.equal((await verifyOtp('challenge-id','654321')).token,'server-token');
  globalThis.fetch=async()=>Response.json(challenge);
  await assert.rejects(verifyOtp('challenge-id','654321'),/inv/);
  assert.equal((await resendOtp('challenge-id')).requiresOtp,true);
  globalThis.fetch=async()=>Response.json({detail:'Espera para reenviar'},{status:429});
  await assert.rejects(resendOtp('challenge-id'),/Espera/);

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
