// Run against a disposable Chrome profile, remote debugging on 9241 and Vite on 5181.
// No dependencies or account credentials are embedded in this test.
import assert from 'node:assert/strict';
const origin = 'http://127.0.0.1:5181';
const pages = await (await fetch('http://127.0.0.1:9241/json/list')).json();
const socket = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
await new Promise(resolve => socket.addEventListener('open',resolve,{once:true}));
let sequence=0;
const pending=new Map();
socket.addEventListener('message', event=>{
  const message=JSON.parse(event.data);
  if(pending.has(message.id)){const {resolve,reject}=pending.get(message.id);pending.delete(message.id);message.error?reject(new Error(message.error.message)):resolve(message.result);}
});
function send(method,params={}){return new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);return r.result.value;}
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function wait(expression){for(let i=0;i<80;i++){if(await evaluate(expression))return;await delay(100);}throw new Error(`Timeout: ${expression}\n${await evaluate('document.body.innerText')}`);}
async function navigate(path){await send('Page.navigate',{url:origin+path});await wait('document.querySelector("#root")?.innerText.length > 0');await delay(150);}
async function click(text){await evaluate(`(()=>{const el=[...document.querySelectorAll('button,a')].find(el=>el.getClientRects().length&&el.textContent.trim()===${JSON.stringify(text)});if(!el)throw Error('Missing button: '+${JSON.stringify(text)});el.click();})()`);await delay(100);}
async function fill(selector,value){await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el)throw Error('Missing field');const prototype=el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:el.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));})()`);}
const check=async(expression)=>assert.equal(await evaluate(expression),true,expression);
// Mocked HTTP only: no real accounts, SQL mutations or email.
const mock = `(() => {
  window.__calls=[];
  const role=location.pathname.startsWith('/admin')?'ADMIN':location.pathname.startsWith('/reclutador')?'RECLUTADOR':'CANDIDATO';
  const user={id:11,email:'qa@example.test',rol:role,nombres:'QA',apellidos:'Prueba',authenticated:true,token:'fixture'};
  localStorage.setItem('gtel-user',JSON.stringify(user));
  const job={id:1,title:'Oferta QA',description:'Descripción guardada en el servidor',department:'Ventas',location:'Lima',type:'full_time',modality:'presencial',salaryMin:1000,salaryMax:2000,salary:'S/ 1000 - 2000',vacancies:1,status:'activa',date:'2026-10-05',deadline:null,tags:['Ventas']};
  window.fetch=async(url,options={})=>{
    const path=new URL(url,location.href).pathname;
    window.__calls.push({path,method:options.method||'GET',body:typeof options.body==='string'?options.body:null});
    if(path==='/api/auth/me')return Response.json(user);
    if(path==='/api/auth/password/reset')return Response.json({message:'Contraseña actualizada.'});
    if(path==='/api/recruiter/jobs/trash')return Response.json([{id:1,title:'Oferta QA',expiresAt:Date.now()+86400000}]);
    if(path.endsWith('/restore')||options.method==='DELETE')return Response.json({});
    if(path==='/api/jobs'||path==='/api/recruiter/jobs')return Response.json([job]);
    if(path==='/api/recruiter/jobs/1')return Response.json({...job,...JSON.parse(options.body)});
    if(path==='/api/recruiter/applications')return Response.json([{id:1,name:'Candidato QA',job:'Oferta QA',status:'recibida',steps:[{label:'recibida',date:'2026-10-05'}]}]);
    if(path==='/api/admin/audit')return Response.json({items:[],page:0,hasMore:false});
    if(path.startsWith('/api/'))return Response.json([]);
    throw Error('Unexpected fetch '+path);
  };
})()`;
try{
 await send('Page.enable');
 await send('Page.addScriptToEvaluateOnNewDocument',{source:mock});
 await navigate('/ofertas');
 await wait('document.body.innerText.includes("Oferta QA")');
 await navigate('/ofertas/1');
 await wait('document.body.innerText.includes("Descripción guardada en el servidor")');
 await navigate('/recuperar-acceso#token=fixture-reset-token');
 await wait('document.querySelectorAll("input[type=password]").length===2');
 await check('location.hash===""');
 await click('Mostrar contraseñas');
 await check('document.querySelectorAll("input[type=text]").length===2');
 await click('Ocultar contraseñas');
 await fill('input[type=password]','Fixture2026!Pass');
 await fill('label:nth-child(2) input','Fixture2026!Pass');
 await click('Cambiar contraseña');
 await wait('document.body.innerText.includes("Contraseña actualizada.")');
 await check('JSON.parse(window.__calls.find(c=>c.path.endsWith("/reset")).body).token==="fixture-reset-token"');
 await navigate('/reclutador/seleccion');
 await wait('document.body.innerText.includes("Programar entrevista")');
 await check('document.body.innerText.includes("Registrar evaluación")');
 await check('document.querySelector("details summary")?.textContent.includes("Historial")');
 await click('Gestionar postulación');
 await check('[...document.querySelectorAll("form select")].filter(s=>s.value==="1").length===2');
 await navigate('/reclutador/ofertas/1/editar');
 await wait('document.querySelector("input[name=title]")?.value==="Oferta QA"');
 await fill('input[name=title]','Oferta editada');
 await fill('input[name=education]','Técnico');
 await fill('input[name=tagsText]','Ventas, Atención');
 await click('Guardar');
 await wait('document.body.innerText.includes("Oferta actualizada.")');
 await check('window.__calls.some(c=>c.method==="PUT"&&c.path==="/api/recruiter/jobs/1")');
 await check('JSON.parse(window.__calls.find(c=>c.method==="PUT").body).tags.length===2');
 await navigate('/reclutador/ofertas');
 await wait('document.body.innerText.includes("Oferta QA")');
 await evaluate('window.confirm=()=>true');
 await click('Eliminar oferta');
 await wait('window.__calls.some(c=>c.method==="DELETE"&&c.path==="/api/recruiter/jobs/1")');
 await navigate('/reclutador/ofertas/papelera');
 await wait('document.body.innerText.includes("Restaurar oferta")');
 await click('Restaurar oferta');
 await wait('window.__calls.some(c=>c.method==="POST"&&c.path.endsWith("/restore"))');
 await navigate('/notificaciones');
 await wait('document.body.innerText.includes("Mis notificaciones")');
 console.log('PASS browser: offers/detail, StrictMode recovery token, recruiter selection, job edit and notifications (mock HTTP).');
}finally{socket.close();}