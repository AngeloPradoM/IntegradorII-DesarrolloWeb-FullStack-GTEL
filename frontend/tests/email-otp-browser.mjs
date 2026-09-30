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
// Browser UI test with mocked HTTP responses; no real accounts or emails.
const mock = `(() => {
  window.__otpCalls = [];
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (url, options = {}) => {
    const path = new URL(String(url), location.href).pathname;
    if (!path.startsWith('/api/auth/')) return originalFetch(url, options);
    window.__otpCalls.push(path);
    const body = options.body ? JSON.parse(options.body) : {};
    const profile = {id:98765,email:'browser@example.test',rol:'CANDIDATO',nombres:'Prueba',apellidos:'Navegador',authenticated:true};
    if (path.endsWith('/login') || path.endsWith('/resend-otp')) return Response.json({requiresOtp:true,authenticated:false,sessionId:'test-browser-session',maskedEmail:'b***@example.test',resendAfterSeconds:1,expiresInSeconds:300});
    if (path.endsWith('/verify-otp')) return body.otp === '654321' ? Response.json({...profile,verified:true,token:'browser-fixture-token'}) : Response.json({detail:'Código incorrecto.'},{status:401});
    if (path.endsWith('/me')) return Response.json(profile);
    throw Error('Unexpected auth path');
  };
})()`;
try {
  await send('Page.enable');
  await send('Page.addScriptToEvaluateOnNewDocument',{source:mock});
  await navigate('/');
  await evaluate('localStorage.clear()');
  await navigate('/?auth=login&redirect=%2Fmis-postulaciones');
  await evaluate(mock);
  await fill('#auth-email','browser@example.test');
  await fill('#auth-password','fixture-only');
  await click('Ingresar');
  await wait('document.querySelectorAll("fieldset input").length === 6');
  await check('document.body.innerText.includes("b***@example.test")');
  await check('!localStorage.getItem("gtel-user")');
  for (let i=0;i<6;i++) await fill(`fieldset input:nth-child(${i+1})`,'0');
  await click('Verificar código');
  await wait('document.body.innerText.includes("Código incorrecto.")');
  await check('!localStorage.getItem("gtel-user")');
  await wait('[...document.querySelectorAll("button")].some(b=>b.textContent.includes("Volver a enviar")&&!b.disabled)');
  await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent.includes("Volver a enviar")).click()');
  await wait('[...document.querySelectorAll("fieldset input")].every(i=>i.value === "")');
  for (let i=0;i<6;i++) await fill(`fieldset input:nth-child(${i+1})`,'654321'[i]);
  await click('Verificar código');
  await wait('location.pathname === "/mis-postulaciones"');
  await check('JSON.parse(localStorage.getItem("gtel-user")).token === "browser-fixture-token"');
  await navigate('/mis-postulaciones');
  await wait('document.querySelector("[aria-controls=account-menu]") !== null');
  await check('window.__otpCalls.includes("/api/auth/me")');
  await evaluate('document.querySelector("[aria-controls=account-menu]").click()');
  await click('Cerrar sesión');
  await wait('!localStorage.getItem("gtel-user")');
  await wait('document.querySelector("#auth-email") !== null');
  await fill('#auth-email','browser@example.test');await fill('#auth-password','fixture-only');await click('Ingresar');
  await wait('document.querySelectorAll("fieldset input").length === 6');
  await evaluate('document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}))');
  await wait('!document.querySelector("[role=dialog]")');
  console.log('PASS browser: OTP form, masked email, wrong code without session, resend, success redirect, reload /me, logout and close. Mock API; no mail sent.');
} finally {socket.close();}
