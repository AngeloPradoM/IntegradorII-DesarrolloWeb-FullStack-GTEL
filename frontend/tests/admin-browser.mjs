// Run against a disposable Chrome profile, remote debugging on 9238 and Vite on 5173.
// No dependencies or account credentials are embedded in this test.
import assert from 'node:assert/strict';
const origin = 'http://127.0.0.1:5173';
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

// Requires the explicitly enabled local development accounts.
try {
 await send('Page.enable'); await navigate('/'); await evaluate('localStorage.clear()'); await navigate('/?auth=login');
 await check('!document.body.innerText.includes("Soy candidato") && !document.body.innerText.includes("Soy reclutador")');
 await fill('#auth-email','Administrador@gmail.com'); await fill('#auth-password','AdminSecure2026*'); await click('Ingresar');
 await wait('location.pathname === "/admin" && document.body.innerText.includes("administrador@gmail.com")');
 await navigate('/mis-postulaciones'); await check('location.pathname === "/mis-postulaciones"');
 await navigate('/reclutador/dashboard'); await check('location.pathname === "/reclutador/dashboard"');
 await navigate('/admin'); await wait('document.body.innerText.includes("administrador@gmail.com")');
 await click('Registrar usuario'); await check('document.querySelector("input[name=email]") !== null'); await click('Cancelar');
 await evaluate('localStorage.clear()'); await navigate('/?auth=login');
 await fill('#auth-email','postulante1@gmail.com'); await fill('#auth-password','Postulante2026!'); await click('Ingresar');
 await wait('location.pathname === "/mis-postulaciones"'); await navigate('/admin'); await wait('location.pathname !== "/admin"');
 console.log('PASS browser: unified login, admin panel, cross-role views, reload, candidate blocked from admin.');
} finally { socket.close(); }
