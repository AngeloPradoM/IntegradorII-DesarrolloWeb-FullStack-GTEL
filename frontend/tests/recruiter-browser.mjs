// Run against a disposable Chrome profile, remote debugging on 9238 and Vite on 5178.
// No dependencies or account credentials are embedded in this test.
import assert from 'node:assert/strict';
const origin = 'http://127.0.0.1:5178';
const pages = await (await fetch('http://127.0.0.1:9238/json/list')).json();
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

try {
  // Run after browser-flows.mjs, which leaves the disposable profile signed in as recruiter.
  for(const [path,message] of [['ofertas','No hay ofertas publicadas.'],['postulantes','No hay postulantes'],['entrevistas','No hay entrevistas programadas.'],['evaluaciones','No hay evaluaciones']]){
    await navigate('/reclutador/'+path);await wait('document.body.innerText.includes('+JSON.stringify(message)+')');
    console.log('PASS recruiter route: '+path);
  }
  await navigate('/reclutador/ofertas/missing');await wait('document.body.innerText.includes("No se encontró la oferta")');
  await navigate('/reclutador/postulantes/missing');await wait('document.body.innerText.includes("no encontrado") || document.body.innerText.includes("No se encontró")');
  await navigate('/reclutador/missing');await wait('document.body.innerText.includes("Esta página no existe")');
  await navigate('/reclutador/entrevistas');
  const before=await evaluate('document.querySelector("h3").textContent');
  await evaluate(`[...document.querySelectorAll('button')].find(el=>el.getAttribute('aria-label')==='Mes siguiente').click()`);
  assert.notEqual(await evaluate('document.querySelector("h3").textContent'),before);
  await fill('input[placeholder*="Enter"]','audit-query');
  await evaluate('document.querySelector("header form").requestSubmit()');
  await wait('location.pathname === "/reclutador/postulantes" && location.search.includes("audit-query")');
  console.log('PASS recruiter: missing IDs, 404, calendar and header search');
  await evaluate(`(async()=>{const {recruiterTransport:t}=await import('/src/services/recruiterTransport.js');t.candidates=async()=>{throw Error('internal test error');};document.querySelector('a[href="/reclutador/ofertas"]').click();})()`);
  await click('Postulantes');await wait('document.body.innerText.includes("No se pudo completar")');
  await check('!document.body.innerText.includes("internal test error")');
  await evaluate(`(async()=>{const {recruiterTransport:t}=await import('/src/services/recruiterTransport.js');t.candidates=async()=>[{id:'test-fixture',name:'Test record',status:'approved'}];})()`);
  await click('Reintentar');await wait('document.body.innerText.includes("Test record")');
  await fill('input[placeholder="Buscar por nombre o puesto..."]','no-match');
  await wait('document.body.innerText.includes("No hay resultados para estos filtros")');
  await fill('input[placeholder="Buscar por nombre o puesto..."]','Test record');
  await check('document.body.innerText.includes("Test record")');
  await fill('select','new');await wait('document.body.innerText.includes("No hay resultados para estos filtros")');
  await fill('select','approved');await wait('document.body.innerText.includes("Test record")');
  await navigate('/reclutador/dashboard'); // Reload clears test-only transport overrides.
  console.log('PASS recruiter: safe errors, retry and filters with isolated test fixtures');
} finally {socket.close();}
