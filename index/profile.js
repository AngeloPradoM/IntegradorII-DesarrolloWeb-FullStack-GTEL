// Real authentication uses the server cookie, never sessionStorage as proof of login.
let activeProfile = null;
let challenge = null;
let resendAt = 0;
let authBusy = false;
const nav = document.querySelector('.nav');
nav.insertAdjacentHTML('beforeend', '<div class="profile" hidden><button type="button" id="profile-toggle" aria-expanded="false" aria-controls="profile-menu"><span class="avatar"><svg aria-hidden="true"><use href="#user"/></svg></span><span id="header-name"></span>⌄</button><div id="profile-menu" hidden><div class="profile-summary"><strong id="menu-name"></strong><span id="menu-email"></span></div><button id="edit-profile" type="button">Editar perfil (vista previa)</button><button id="logout" type="button">Cerrar sesión</button></div></div>');
document.querySelector('main').insertAdjacentHTML('beforeend','<p id="session-status" role="status"></p>');
form.insertAdjacentHTML('afterend','<form id="email-verification" hidden><p id="email-destination"></p><label for="email-code">Código de verificación</label><input id="email-code" name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required><p id="otp-feedback" role="status"></p><button class="primary submit" type="submit">Verificar código</button><button id="resend-code" class="secondary cancel" type="button">Reenviar código</button><button id="back-login" class="text-button" type="button">Volver al inicio de sesión</button></form>');
const verifyForm=document.querySelector('#email-verification');
const otpFeedback=document.querySelector('#otp-feedback');
const sessionStatus=document.querySelector('#session-status');
const profileToggle=document.querySelector('#profile-toggle');
const profileMenu=document.querySelector('#profile-menu');

async function api(path, body) {
  if (location.protocol==='file:') throw Error('Abre la dirección que muestra npm start después de iniciar el servidor.');
  let response;
  try {response=await fetch('/api'+path,{method:body===undefined?'GET':'POST',credentials:'same-origin',signal:AbortSignal.timeout(45000),headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});}
  catch(error) {throw Error(error.name==='TimeoutError' ? 'La solicitud tardó demasiado. Si te registraste, intenta iniciar sesión antes de repetir el registro.' : 'No se pudo conectar con el servidor local.');}
  let data;
  try {data=await response.json();} catch {throw Error('Abre la dirección que muestra npm start, no Live Server.');}
  if(!response.ok) throw Object.assign(Error(data.message || 'No se pudo completar la solicitud.'),{status:response.status});
  return data;
}
function renderProfile() {
  document.querySelector('.profile').hidden=!activeProfile;
  document.querySelector('.nav-actions').hidden=Boolean(activeProfile);
  document.querySelector('#header-name').textContent=activeProfile ? activeProfile.nombres : '';
  document.querySelector('#menu-name').textContent=activeProfile ? activeProfile.nombres+' '+activeProfile.apellidos : '';
  document.querySelector('#menu-email').textContent=activeProfile?.email || '';
  profileMenu.hidden=true;profileToggle.setAttribute('aria-expanded','false');
}
function busy(value) {
  authBusy=value;
  dialog.querySelectorAll('button').forEach(button=>button.disabled=value);
  tick();
}
function tick() {
  const seconds=Math.max(0,Math.ceil((resendAt-Date.now())/1000));
  const button=document.querySelector('#resend-code');
  button.disabled=authBusy || seconds>0;
  button.textContent=seconds ? 'Reenviar en '+seconds+' s' : 'Reenviar código';
}
setInterval(tick,1000);
function showChallenge(data) {
  challenge=data;resendAt=Date.now()+data.retryAfter*1000;
  form.hidden=true;verifyForm.hidden=false;
  document.querySelector('.tabs').hidden=true;
  document.querySelector('#modal-title').textContent='Verifica tu correo';
  document.querySelector('#subtitle').textContent='Introduce el código recibido para continuar';
  document.querySelector('#email-destination').textContent='Se envió un código a '+data.email+'. Vence en 5 minutos. Revisa también Spam.';
  otpFeedback.textContent='';verifyForm.reset();tick();document.querySelector('#email-code').focus();
}
function resetChallenge() {
  verifyForm.reset();otpFeedback.textContent='';
  challenge=null;verifyForm.hidden=true;form.hidden=false;
  document.querySelector('.tabs').hidden=true;
  mode='login';render();
}
form.addEventListener('submit',async event=>{
  event.preventDefault();event.stopImmediatePropagation();
  if(authBusy) return;
  if(mode==='register' && !validateRegistration()) return;
  const values=Object.fromEntries(new FormData(form));
  busy(true);feedback.hidden=false;feedback.textContent='Enviando código a tu correo…';
  try {
    const result=await api(mode==='register'?'/auth/register':'/auth/login',values);
    password.value='';document.querySelector('#confirmarPassword').value='';showChallenge(result);
  } catch(error){feedback.hidden=false;feedback.textContent=error.message;}
  finally{busy(false);}
},true);
verifyForm.addEventListener('submit',async event=>{
  event.preventDefault();if(authBusy || !challenge) return;busy(true);
  try {
    const result=await api('/auth/verify',{challengeId:challenge.challengeId,code:verifyForm.elements.code.value});
    if(result.user) {
      activeProfile=result.user;window.previewProfile.save(activeProfile);dialog.close();renderProfile();sessionStatus.textContent='Sesión iniciada después de verificar tu correo.';
    } else {resetChallenge();feedback.hidden=false;feedback.textContent=result.message;}
  } catch(error){otpFeedback.textContent=error.message;}
  finally{busy(false);}
});
document.querySelector('#resend-code').addEventListener('click',async()=>{
  if(authBusy || !challenge || Date.now()<resendAt) return;busy(true);
  try{showChallenge(await api('/auth/resend',{challengeId:challenge.challengeId}));}catch(error){otpFeedback.textContent=error.message;}finally{busy(false);}
});
document.querySelector('#back-login').addEventListener('click',resetChallenge);
dialog.addEventListener('cancel',event=>{if(authBusy)event.preventDefault();});
dialog.addEventListener('click',event=>{if(authBusy)event.stopImmediatePropagation();},true);
dialog.addEventListener('close',resetChallenge);
profileToggle.addEventListener('click',()=>{profileMenu.hidden=!profileMenu.hidden;profileToggle.setAttribute('aria-expanded',String(!profileMenu.hidden));});
document.querySelector('.profile').addEventListener('focusout',event=>{if(!event.currentTarget.contains(event.relatedTarget)){profileMenu.hidden=true;profileToggle.setAttribute('aria-expanded','false');}});
document.addEventListener('click',event=>{if(!event.target.closest('.profile')){profileMenu.hidden=true;profileToggle.setAttribute('aria-expanded','false');}});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!profileMenu.hidden){profileMenu.hidden=true;profileToggle.setAttribute('aria-expanded','false');profileToggle.focus();}});
document.querySelector('#edit-profile').addEventListener('click',()=>{if(activeProfile){window.previewProfile.save(activeProfile);location.href='editar-perfil.html';}});
document.querySelector('#logout').addEventListener('click',async()=>{
  try{await api('/auth/logout',{});activeProfile=null;window.previewProfile.clear();renderProfile();sessionStatus.textContent='Sesión cerrada.';}catch(error){sessionStatus.textContent=error.message;}
});
api('/me').then(data=>{activeProfile=data.user;window.previewProfile.save(activeProfile);renderProfile();}).catch(error=>{window.previewProfile.clear();if(error.status!==401) sessionStatus.textContent=error.message;});
renderProfile();
