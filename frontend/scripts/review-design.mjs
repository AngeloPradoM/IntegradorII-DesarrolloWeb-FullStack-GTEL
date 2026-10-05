// Local browser review: Chrome must run with --remote-debugging-port=9222.
// All API responses below are isolated test fixtures, never production fallbacks.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:5173';
const pages=await (await fetch('http://127.0.0.1:9222/json')).json();
const page=pages.find(p=>p.type==='page');
const socket=new WebSocket(page.webSocketDebuggerUrl);
await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
let sequence=0;
const pending=new Map(), exceptions=[], requests=[];
function command(method,params={}) { return new Promise((resolve,reject)=>{
  const id=++sequence;
  const timer=setTimeout(()=>{pending.delete(id);reject(new Error(`Timeout: ${method}`));},15000);
  pending.set(id,{resolve:r=>{clearTimeout(timer);resolve(r);},reject});
  socket.send(JSON.stringify({id,method,params}));
}); }
const fixtures={
  '/api/recruiter/applications':[{id:1,name:'Candidato de prueba',job:'Agente de Ventas',date:'2026-09-23',status:'en_revision',score:85}],
  '/api/recruiter/selection/interviews':[{id:1,name:'Candidato de prueba',job:'Agente de Ventas',time:'10:00',duration:'30 min',type:'video',date:'2026-05-19',status:'programada'}],
  '/api/recruiter/selection/evaluations':[{id:1,name:'Candidato de prueba',job:'Agente de Ventas',test:'Ventas',score:85,time:'20 min',date:'2026-09-23',status:'aprobado'}],
  '/api/recruiter/jobs':[{id:1,title:'Agente de Ventas',status:'activa',location:'Lima',type:'full_time',salary:'S/ 1500'}],
  '/api/notifications':[],
  '/api/auth/register':{message:'Cuenta creada'},
  '/api/auth/login':{requiresOtp:true,status:'OTP_REQUIRED',sessionId:'test-session',maskedPhone:'******4321',resendAfterSeconds:0,expiresInSeconds:300},
  '/api/auth/resend-otp':{requiresOtp:true,status:'OTP_REQUIRED',sessionId:'test-session',maskedPhone:'******4321',resendAfterSeconds:0,expiresInSeconds:300},
};
socket.addEventListener('message',event=>{
  const data=JSON.parse(event.data);
  if(data.id){const p=pending.get(data.id);if(p){pending.delete(data.id);data.error?p.reject(new Error(data.error.message)):p.resolve(data.result);}return;}
  if(data.method==='Runtime.exceptionThrown')exceptions.push(data.params.exceptionDetails.exception?.description || data.params.exceptionDetails.text);
  if(data.method==='Fetch.requestPaused'){
    const req=data.params.request;
    const url=new URL(req.url);
    if(req.method==='OPTIONS') {
      command('Fetch.fulfillRequest',{requestId:data.params.requestId,responseCode:204,responseHeaders:[{name:'Access-Control-Allow-Origin',value:base},{name:'Access-Control-Allow-Methods',value:'GET, POST, OPTIONS'},{name:'Access-Control-Allow-Headers',value:'Content-Type, Authorization'}]}).catch(e=>exceptions.push(e.message));
      return;
    }
    requests.push({path:url.pathname,body:req.postData});
    let body=fixtures[url.pathname] || {}, status=200;
    if(url.pathname==='/api/auth/verify-otp') {
      if(JSON.parse(req.postData).otp==='123456') body={verified:true,token:'test-signed-jwt',email:'test@example.com',role:'CANDIDATO'};
      else {body={status:'OTP_INVALID'};status=401;}
    }
    command('Fetch.fulfillRequest',{requestId:data.params.requestId,responseCode:status,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:base},{name:'Access-Control-Allow-Headers',value:'Content-Type, Authorization'}],body:Buffer.from(JSON.stringify(body)).toString('base64')}).catch(e=>exceptions.push(e.message));
  }
});
async function evaluate(expression){const r=await command('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.text);return r.result.value;}
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function navigate(route){await command('Page.navigate',{url:base+route});await pause(700);}
async function input(selector,value){await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el)throw Error('Missing input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('input',{bubbles:true}));})()`);}
async function submit(){await evaluate(`document.querySelector('form').requestSubmit()`);await pause(400);}
await command('Page.enable');await command('Runtime.enable');
await command('Fetch.enable',{patterns:[{urlPattern:'*://localhost:8080/api/*'},{urlPattern:'*://127.0.0.1:8080/api/*'}]});
await navigate('/login');await evaluate('localStorage.clear()');await navigate('/login');
await input('[name=email]','test@example.com');await input('[name=password]','Password-123!');await submit();
assert.equal(await evaluate('localStorage.getItem("gtel-user")'),null,'JWT persisted before OTP');
assert.ok((await evaluate('document.body.innerText')).includes('******4321'),'Masked phone missing');
await input('[inputmode=numeric]','000000');await submit();
assert.ok((await evaluate('document.body.innerText')).includes('incorrecto'),'Wrong OTP message missing');
await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Volver a enviar')).click()`);await pause(400);
assert.ok(requests.some(r=>r.path==='/api/auth/resend-otp' && JSON.parse(r.body).sessionId==='test-session'));
await input('[inputmode=numeric]','123456');await submit();
assert.equal(await evaluate('JSON.parse(localStorage.getItem("gtel-user")).token'),'test-signed-jwt');
assert.equal(await evaluate('JSON.parse(localStorage.getItem("gtel-user")).password'),undefined);
await evaluate('localStorage.clear()');await navigate('/login?registro=1');
for(const [name,value] of Object.entries({nombres:'Ana',apellidos:'Prueba',telefono:'+51987654321',email:'new@example.com',password:'Password-123!'}))await input(`[name=${name}]`,value);
await submit();
assert.ok(requests.some(r=>r.path==='/api/auth/register' && JSON.parse(r.body).telefono==='+51987654321'),'Registration lost phone');

const routes=['/','/ofertas','/login','/postulacion/1','/mis-postulaciones','/reclutador/dashboard','/reclutador/publicar-oferta','/reclutador/postulantes','/reclutador/entrevistas','/reclutador/evaluaciones','/reclutador/postulantes/1'];
const output=path.join(os.tmpdir(),'gtel-ui-review');
fs.mkdirSync(output,{recursive:true});
const report=[];
for(const width of [1440,768,390]){
 await command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width===390});
 for(let index=0;index<routes.length;index++){
   const route=routes[index];
   const user={token:'review-fixture-token',email:'review@example.com',nombres:'Usuario de prueba',rol:route.startsWith('/reclutador')?'RECLUTADOR':'CANDIDATO',isVerified:true};
   await evaluate(`localStorage.setItem('gtel-user', ${JSON.stringify(JSON.stringify(user))})`);
   await navigate(route);
   const metrics=await evaluate(`({width:innerWidth,contentWidth:document.documentElement.scrollWidth,text:document.body.innerText.length,path:location.pathname,dialogs:document.querySelectorAll('[role=dialog]').length})`);
   assert.ok(metrics.text>100,`Empty screen: ${route}`);
   assert.equal(metrics.path,route,`Unexpected redirect: ${route}`);
   assert.equal(metrics.dialogs,0,`Unexpected dialog: ${route}`);
   report.push({route,width,overflow:metrics.contentWidth>width+1});
   if(width!==768){const png=await command('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(output,`${width}-${index+1}.png`),Buffer.from(png.data,'base64'));}
 }
}
// Publishing keeps the existing local persistence and propagates the selected shift.
await evaluate(`localStorage.setItem('gtel-user',JSON.stringify({token:'review-fixture-token',email:'review@example.com',rol:'RECLUTADOR',isVerified:true}))`);
await navigate('/reclutador/publicar-oferta');
const previousJobs=await evaluate(`localStorage.getItem('gtel-jobs')`);
await evaluate(`(()=>{const select=Array.from(document.querySelectorAll('select')).find(el=>Array.from(el.options).some(o=>o.value==='Part-Time'));select.value='Part-Time';select.dispatchEvent(new Event('change',{bubbles:true}));})()`);
await pause(100);
await evaluate(`Array.from(document.querySelectorAll('button')).find(el=>el.textContent.includes('Publicar Oferta')).click()`);
await pause(200);
assert.equal(await evaluate(`JSON.parse(localStorage.getItem('gtel-jobs'))[0].type`),'Part-Time');
await evaluate(previousJobs===null?`localStorage.removeItem('gtel-jobs')`:`localStorage.setItem('gtel-jobs',${JSON.stringify(previousJobs)})`);
await evaluate(`localStorage.removeItem('gtel-user')`);
await navigate('/postulacion/1');
assert.equal(await evaluate('location.pathname'),'/login','Protected application bypassed login');
fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({checks:report,exceptions},null,2));
socket.close();
console.log(JSON.stringify({output,screens:report.length,overflow:report.filter(r=>r.overflow),exceptions,authChecks:'login, wrong OTP, resend, verify, registration phone, no password storage, protected routes',publication:'local persistence and selected shift retained'},null,2));
assert.equal(exceptions.length,0,'Browser runtime exceptions');
assert.equal(report.filter(r=>r.overflow).length,0,'Horizontal overflow');
