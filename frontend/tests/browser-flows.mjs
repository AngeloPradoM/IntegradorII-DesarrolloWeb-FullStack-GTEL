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
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await navigate('/');
  await evaluate('localStorage.clear()');
  await navigate('/?auth=register');
  // Mock only registration to avoid creating real accounts during browser checks.
  await evaluate(`(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (url, options) => {
      if (String(url).endsWith('/api/auth/register')) {
        window.__registrationRequest = JSON.parse(options.body);
        return new Response(JSON.stringify({user:{id:1,email:window.__registrationRequest.email}}), {status:201,headers:{'Content-Type':'application/json'}});
      }
      return originalFetch(url, options);
    };
  })()`);

  // Simulate sequential typing, which previously removed the separating space.
  for(const value of ['Juan','Juan ','Juan C','Juan Carlos']) await fill('#nombres',value);
  await check('document.querySelector("#nombres").value === "Juan Carlos"');
  await fill('#apellidos','De la Cruz');
  await fill('#email',`registration-${Date.now()}@example.test`);
  await fill('#telefono','987654321');await fill('#ubicacion','Lima');
  const generatedPassword=crypto.randomUUID()+'aA!';
  await fill('#password',generatedPassword);await fill('#confirmarPassword',generatedPassword);
  await click('Crear cuenta');await wait('document.querySelector("#auth-email") !== null');
  const registrationRequest = await evaluate('window.__registrationRequest');
  assert.equal(registrationRequest.nombres, 'Juan Carlos');assert.equal(registrationRequest.apellidos, 'De la Cruz');
  console.log('PASS 1: compound names and completed registration');
  await navigate('/?auth=login');
  for(const close of ['x','escape','backdrop']){
    await click('Completar acceso demo como candidato');await click('Ingresar');
    await wait('document.body.innerText.includes("Código enviado por WhatsApp")');
    if(close==='x')await evaluate(`document.querySelector('[aria-label="Cerrar modal"]').click()`);
    if(close==='escape')await evaluate('document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}))');
    if(close==='backdrop')await evaluate('document.querySelector("[role=dialog]").previousElementSibling.click()');
    await wait('!document.querySelector("[role=dialog]")');
    await click('Iniciar Sesión');
    await check('document.querySelector("#auth-email").value === "" && !document.body.innerText.includes("Código enviado por WhatsApp")');
  }
  console.log('PASS 8–10: all login close paths reset OTP and fields');
  await click('Completar acceso demo como candidato');await click('Ingresar');
  await wait('document.body.innerText.includes("Código enviado por WhatsApp")');
  // Read the project's existing demo code, instead of adding credentials to tests.
  await evaluate(`(async()=>{const {DEMO_OTP}=await import('/src/mocks/mockData.js');const inputs=[...document.querySelectorAll('input')].filter(x=>x.inputMode==='numeric');for(let i=0;i<inputs.length;i++){Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(inputs[i],inputs.length===1?DEMO_OTP:DEMO_OTP[i]);inputs[i].dispatchEvent(new Event('input',{bubbles:true}));}})()`);
  await click('Verificar código');await wait('location.pathname === "/mis-postulaciones"');
  console.log('PASS 17a: login and OTP');
  await navigate('/postulacion/ID_INEXISTENTE');await check('document.body.innerText.includes("Oferta no encontrada") && !document.querySelector("input[name=dni]")');
  console.log('PASS 7: missing job');
  await navigate('/postulacion/1');await click('Siguiente');await check('document.body.innerText.includes("DNI de 8 dígitos")');
  await fill('[name=nombres]','Juan Carlos');await fill('[name=apellidos]','De la Cruz');await fill('[name=dni]','12345678');await fill('[name=telefono]','987654321');await click('Siguiente');
  await click('← Anterior');await check('document.querySelector("[name=nombres]").value === "Juan Carlos"');await click('Siguiente');
  await click('Siguiente');await check('document.body.innerText.includes("Adjunta tu CV")');
  await evaluate(`(()=>{const input=document.querySelector('input[type=file]');const dt=new DataTransfer();dt.items.add(new File(['%PDF-test'],'cv.pdf',{type:'application/pdf'}));input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  await click('Siguiente');await check('document.body.innerText.includes("Juan Carlos De la Cruz") && !document.body.innerText.includes("Luis Alberto")');
  await click('Enviar Postulación');await check('document.body.innerText.includes("Acepta los términos")');
  await evaluate('document.querySelector("#terms").click()');await click('Enviar Postulación');await wait('document.body.innerText.includes("¡Postulación enviada!")');
  console.log('PASS 2–5: validation, back navigation, CV, terms and real confirmation');
  await navigate('/mis-postulaciones');await wait('document.body.innerText.includes("Asesor de Ventas")');
  await evaluate(`(async()=>{const api=await import('/src/services/api.js');const a=JSON.parse(localStorage.getItem('gtel-user'));const b={...a,id:'independent-browser-test'};const items=await api.getCandidateApplications(a);if(items.length!==1)throw Error('Missing application');if((await api.getCandidateApplications(b)).length)throw Error('Leaked applications');await api.createApplication({id:1},{personalData:items[0].personalData,cv:items[0].cv,termsAccepted:true},b);if((await api.getCandidateApplications(b)).length!==1)throw Error('Second account cannot apply');if((await api.getCandidateApplications(a)).length!==1)throw Error('First account changed');})()`);
  console.log('PASS 6: independent applications per candidate');
  await navigate('/perfil');await fill('[name=nombres]','Juan Carlos Editado');await click('Ofertas');await wait('document.body.innerText.includes("Tienes cambios sin guardar")');await click('Seguir editando');await check('location.pathname === "/perfil"');
  await fill('[name=apellidos]','De la Cruz');await fill('[name=ubicacion]','Lima');await click('Guardar cambios');await wait('document.body.innerText.includes("Cambios guardados")');await click('Ofertas');await wait('location.pathname === "/ofertas"');
  console.log('PASS 11–12: dirty navigation and clean navigation after save');
  await navigate('/not-a-real-route');await check('document.body.innerText.includes("Esta página no existe")');
  console.log('PASS 16: 404');
  await evaluate('document.querySelector("[aria-controls=account-menu]").click()');await click('Cerrar sesión');
  await navigate('/perfil');await wait('document.querySelector("#auth-email") !== null');
  console.log('PASS 17b: logout and protected route');
  await click('Soy Reclutador');await click('Completar acceso demo como reclutador');await click('Ingresar');await wait('document.body.innerText.includes("Código enviado por WhatsApp")');
  await evaluate(`(async()=>{const {DEMO_OTP}=await import('/src/mocks/mockData.js');const inputs=[...document.querySelectorAll('input')].filter(x=>x.inputMode==='numeric');for(let i=0;i<inputs.length;i++){Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(inputs[i],inputs.length===1?DEMO_OTP:DEMO_OTP[i]);inputs[i].dispatchEvent(new Event('input',{bubbles:true}));}})()`);
  await click('Verificar código');await wait('location.pathname.includes("/reclutador/")');
  await navigate('/reclutador/publicar-oferta');
  await fill('input[placeholder*=Senior]','   ');await click('Publicar Oferta');await check('document.body.innerText.includes("Título: completa")');
  await fill('input[placeholder*=Senior]','Oferta prueba');await fill('input[type=number]:not([min])','-100');await click('Publicar Oferta');await check('document.body.innerText.includes("salario válido")');
  await fill('input[type=number]:not([min])','5000');await evaluate(`(()=>{const el=[...document.querySelectorAll('input[type=number]:not([min])')][1];Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,'3000');el.dispatchEvent(new Event('input',{bubbles:true}));})()`);await click('Publicar Oferta');await check('document.body.innerText.includes("máximo no puede ser menor")');
  console.log('PASS 13–15: invalid job publication');
} finally { socket.close(); }
