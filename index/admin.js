const status=document.querySelector('#status'), panel=document.querySelector('#panel'), loginPanel=document.querySelector('#login-panel');
const confirmation=document.querySelector('#confirmation'), resultDialog=document.querySelector('#password-result');
let page=1, selected=null, busy=false, generation=0;
async function api(path,method='GET',body) {
  let response;
  try {response=await fetch('/api/admin'+path,{method,credentials:'same-origin',signal:AbortSignal.timeout(20000),headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});}
  catch {throw Error('No se pudo contactar con el servidor. Actualiza la lista antes de repetir una operación.');}
  let data;
  try {data=await response.json();}catch{throw Error('El servidor no devolvió una respuesta válida. Abre el panel desde la dirección de npm start.');}
  if(response.status===401){showSession(false);confirmation.close();resultDialog.close();status.textContent=data.message || 'La sesión venció. Inicia sesión nuevamente.';}
  if(!response.ok)throw Error(data.message || 'No se pudo completar la operación.');
  return data;
}
function showSession(active) {panel.hidden=!active;loginPanel.hidden=active;document.querySelector('#logout').hidden=!active;if(!active){generation++;document.querySelector('#users').replaceChildren();}}
async function load() {
  const request=++generation;
  status.textContent='Cargando usuarios…';
  document.querySelector('#users').replaceChildren();
  document.querySelector('#previous').disabled=true;
  document.querySelector('#next').disabled=true;
  try {
    const data=await api('/users?'+new URLSearchParams({q:document.querySelector('#search').elements.q.value,page}));
    if(request!==generation)return;
    if(!data.users.length&&page>1){page=Math.max(1,Math.ceil(data.total/20));return load();}
    const rows=document.querySelector('#users');rows.replaceChildren();
    for(const user of data.users){
      const tr=document.createElement('tr');
      for(const value of [user.nombres+' '+user.apellidos,user.email,user.telefono || '—',user.email_verificado_en?'Sí':'Pendiente']){const td=document.createElement('td');td.textContent=value;tr.append(td);}
      const actions=document.createElement('td');
      for(const [action,label] of [['password','Restablecer contraseña'],['delete','Eliminar']]){
        const button=document.createElement('button');button.textContent=label;
        button.addEventListener('click',()=>openConfirmation(user,action));actions.append(button);
      }
      tr.append(actions);rows.append(tr);
    }
    document.querySelector('#summary').textContent=data.total+' usuarios encontrados';
    document.querySelector('#page').textContent='Página '+page;
    document.querySelector('#previous').disabled=page===1;
    document.querySelector('#next').disabled=page*20>=data.total;
    status.textContent=data.users.length?'':'No hay usuarios para esta búsqueda.';
  }catch(error){if(request===generation)status.textContent=error.message;}
}
function openConfirmation(user,action){
  selected={user,action};document.querySelector('#confirm-form').reset();document.querySelector('#confirm-error').textContent='';
  document.querySelector('#confirm-title').textContent=action==='delete'?'Eliminar usuario':'Restablecer contraseña';
  document.querySelector('#confirm-description').textContent=action==='delete'?'Se eliminará '+user.email+' de MySQL junto con sus sesiones y códigos. Esta acción no se puede deshacer.':'Se cambiará la contraseña de '+user.email+' y se cerrarán sus sesiones. El código por correo seguirá siendo obligatorio.';
  confirmation.showModal();
}
document.querySelector('#login').addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;busy=true;const button=event.target.querySelector('button');button.disabled=true;
  try{await api('/login','POST',Object.fromEntries(new FormData(event.target)));event.target.reset();showSession(true);page=1;await load();}catch(error){status.textContent=error.message;}finally{busy=false;button.disabled=false;}
});
document.querySelector('#confirm-form').addEventListener('submit',async event=>{
  event.preventDefault();if(busy||!selected)return;
  const email=document.querySelector('#confirm-email').value.trim().toLowerCase();
  if(email!==selected.user.email.toLowerCase()){document.querySelector('#confirm-error').textContent='El correo no coincide.';return;}
  busy=true;confirmation.querySelectorAll('button').forEach(button=>button.disabled=true);
  try{
    const path='/users/'+encodeURIComponent(selected.user.id);
    const data=await api(selected.action==='delete'?path:path+'/password',selected.action==='delete'?'DELETE':'POST',{email});
    confirmation.close();await load();
    if(data.password&&!panel.hidden){document.querySelector('#new-password').value=data.password;resultDialog.showModal();}
  }catch(error){document.querySelector('#confirm-error').textContent=error.message;status.textContent=error.message;}finally{busy=false;confirmation.querySelectorAll('button').forEach(button=>button.disabled=false);}
});
confirmation.addEventListener('cancel',event=>{if(busy)event.preventDefault();});
document.querySelector('#cancel').onclick=()=>confirmation.close();
document.querySelector('#close-result').onclick=()=>resultDialog.close();
resultDialog.addEventListener('close',()=>{document.querySelector('#new-password').value='';});
document.querySelector('#search').onsubmit=event=>{event.preventDefault();page=1;load();};
document.querySelector('#refresh').onclick=load;
document.querySelector('#previous').onclick=()=>{if(page>1){page--;load();}};
document.querySelector('#next').onclick=()=>{page++;load();};
document.querySelector('#logout').onclick=async()=>{try{await api('/logout','POST',{});showSession(false);status.textContent='Sesión cerrada.';}catch(error){status.textContent=error.message;}};
api('/me').then(()=>{showSession(true);load();}).catch(error=>{status.textContent=error.message;});
