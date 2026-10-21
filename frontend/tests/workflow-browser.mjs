// Run against a disposable Chrome profile, remote debugging on 9241 and Vite on 5181.
// No dependencies or account credentials are embedded in this test.
import assert from 'node:assert/strict';
const origin = 'http://127.0.0.1:5181';
const pages = await (await fetch('http://127.0.0.1:9241/json/list')).json();
const socket = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
await new Promise(resolve => socket.addEventListener('open',resolve,{once:true}));
let sequence=0;
const pending=new Map();
const consoleErrors=[];
socket.addEventListener('message', event=>{
  const message=JSON.parse(event.data);
  if(pending.has(message.id)){const {resolve,reject}=pending.get(message.id);pending.delete(message.id);message.error?reject(new Error(message.error.message)):resolve(message.result);}
  if(message.method==='Runtime.consoleAPICalled' && message.params?.type==='error'){
    consoleErrors.push(message.params.args.map(arg=>arg.value??arg.description??'').join(' '));
  }
});
function send(method,params={}){return new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);return r.result.value;}
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function wait(expression){for(let i=0;i<80;i++){if(await evaluate(expression))return;await delay(100);}throw new Error(`Timeout: ${expression}\n${await evaluate('document.body.innerText')}`);}
async function navigate(path){await send('Page.navigate',{url:origin+path});await wait('document.querySelector("#root")?.innerText.length > 0');await delay(150);}
async function click(text){await evaluate(`(()=>{const el=[...document.querySelectorAll('.selection-navigation button'),...document.querySelectorAll('button,a')].find(el=>el.getClientRects().length&&el.textContent.trim()===${JSON.stringify(text)});if(!el)throw Error('Missing button: '+${JSON.stringify(text)});el.click();})()`);await delay(100);}
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
    if(path==='/api/recruiter/applications/page')return Response.json({items:[{id:1,name:'Candidato QA',job:'Oferta QA',status:'recibida'}],total:1,page:0,size:8});
    if(path==='/api/recruiter/applications/1')return Response.json({id:1,name:'Candidato QA',job:'Oferta QA',status:'recibida'});
    if(path==='/api/recruiter/applications')return Response.json(Array.from({length:10},(_,i)=>({id:i+1,code:'QA-'+(i+1),email:'qa@example.test',name:i===0?'Candidato QA':'Persona '+(i+1),jobId:1,job:'Oferta QA',status:'recibida',steps:[{label:'recibida',date:'2026-10-05'}]})));
    if(path==='/api/recruiter/selection/interviews')return Response.json([{id:1,applicationId:1,name:'Candidato QA',job:'Oferta QA',date:'2026-12-10',time:'10:00:00',minutes:30,type:'video',location:'Sala QA',status:'programada'}]);
    if(path==='/api/recruiter/selection/evaluations'&&options.method==='POST')return Response.json({id:1});
    if(path==='/api/admin/audit')return Response.json({items:[],page:0,hasMore:false});
    if(path.startsWith('/api/'))return Response.json([]);
    throw Error('Unexpected fetch '+path);
  };
})()`;
try{
 await send('Page.enable');
 await send('Runtime.enable');
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
 await navigate('/reclutador/postulantes');
 await wait('document.body.innerText.includes("Candidato QA")');
 await check('window.__calls.some(c=>c.path==="/api/recruiter/applications/page")');
 await check('![...document.querySelectorAll("button")].some(b=>b.textContent.includes("Exportar Excel") && b.getClientRects().length>0)');
 await navigate('/reclutador/postulantes/1');
 await wait('document.body.innerText.includes("Candidato QA")');
 await check('window.__calls.some(c=>c.path==="/api/recruiter/applications/1")');
 await navigate('/reclutador/seleccion');
 await wait('document.body.innerText.includes("Postulaciones y CV")');
 await check('document.querySelectorAll("tbody tr").length===8');
 await click('Siguiente');
 await check('document.querySelectorAll("tbody tr").length===2');
 await click('Anterior');
 await check('document.querySelector("details summary")?.textContent.includes("Historial")');
 await click('Gestionar postulación');
 await check('[...document.querySelectorAll("form select")].filter(s=>s.value==="1").length===2');
 await click('Evaluaciones');
 await wait('document.body.innerText.includes("Registrar evaluación")');
 await fill('section:not([hidden]) input[max="100"]','87');
 await fill('section:not([hidden]) input[maxlength="255"]','Nota solo del candidato uno');
 await fill('section:not([hidden]) form select','2');
 await check('document.querySelectorAll("section:not([hidden]) input[type=number]")[1].value==="0"');
 await check('[...document.querySelectorAll("section:not([hidden]) input")].find(e=>e.maxLength===255).value===""');
 await check('[...document.querySelectorAll("form select")].filter(s=>s.value==="2").length===2');
 await click('Guardar evaluación');
 await wait('window.__calls.some(c=>c.method==="POST"&&c.path.endsWith("/evaluations"))');
 await check('JSON.parse(window.__calls.find(c=>c.method==="POST"&&c.path.endsWith("/evaluations")).body).applicationId===2');
 await check('JSON.stringify([...document.querySelector("section:not([hidden]) select[name=minutes]").options].map(o=>o.value))===JSON.stringify(["15","30","60","90","120"])');
 await click('Entrevistas');
 await check('document.body.innerText.includes("No hay entrevistas registradas.")');
 await fill('section:not([hidden]) form select','1');
 await click('Editar entrevista');
 await check('document.querySelector("gtel-time-picker").isoValue==="10:00"');
 await fill('section:not([hidden]) form select','2');
 await check('document.querySelector("gtel-time-picker").isoValue===""');
 await check('!document.body.innerText.includes("Cancelar edición")');
 await check('document.querySelector("gtel-date-picker").isoValue===""');
 await evaluate('window.dp=document.querySelector("gtel-date-picker");dp.shadowRoot.querySelector(".trigger").click();dp.shadowRoot.querySelector(".year").value="2027";dp.shadowRoot.querySelector(".year").dispatchEvent(new Event("change"));dp.shadowRoot.querySelector(".month").value="0";dp.shadowRoot.querySelector(".month").dispatchEvent(new Event("change"));[...dp.shadowRoot.querySelectorAll("[data-date]")].find(b=>b.dataset.date==="2027-01-15").click()');
 await check('document.querySelector("gtel-date-picker").value==="15/01/2027"');
 await evaluate('window.tp=document.querySelector("gtel-time-picker");tp.shadowRoot.querySelector(".trigger").click();tp.shadowRoot.querySelector("#hours").dispatchEvent(new KeyboardEvent("keydown",{key:"Home",bubbles:true}));tp.shadowRoot.querySelector("#period").dispatchEvent(new KeyboardEvent("keydown",{key:"End",bubbles:true}));tp.shadowRoot.querySelector(".accept").click()');
 await check('document.querySelector("gtel-time-picker").isoValue==="13:00"');
 await fill('select[name=minutes]','90');
 await fill('input[name=location]','Sala QA');
 await click('Guardar entrevista');
 await wait('window.__calls.some(c=>c.method==="POST"&&c.path.endsWith("/interviews"))');
 await check('(()=>{const p=JSON.parse(window.__calls.find(c=>c.method==="POST"&&c.path.endsWith("/interviews")).body);return p.date==="2027-01-15"&&p.time==="13:00"&&p.minutes===90&&p.applicationId===2;})()');
 await check('document.querySelector("gtel-time-picker").isoValue===""');
 await click('Postulaciones');
 await fill('input[aria-label="Buscar postulantes"]','no-match-qa');
 await check('document.body.innerText.includes("No hay postulaciones que coincidan")');
 await fill('input[aria-label="Buscar postulantes"]','');
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await check('document.documentElement.scrollWidth<=window.innerWidth');
 const screenshot=await send('Page.captureScreenshot',{format:'png'});
 const {writeFileSync}=await import('node:fs');const {tmpdir}=await import('node:os');const {join}=await import('node:path');
 writeFileSync(join(tmpdir(),'gtel-selection-mobile.png'),Buffer.from(screenshot.data,'base64'));
 await send('Emulation.clearDeviceMetricsOverride');
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
 assert.deepEqual(consoleErrors,[],`Browser console errors:\n${consoleErrors.join('\n')}`);
 console.log('PASS browser: offers/detail, StrictMode recovery token, recruiter selection, job edit and notifications (mock HTTP).');
}finally{socket.close();}
