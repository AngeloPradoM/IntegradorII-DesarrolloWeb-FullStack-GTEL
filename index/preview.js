(() => {
 const jobs=[{id:'ventas',title:'Asesor de ventas',location:'Lima · Presencial'},{id:'soporte',title:'Soporte técnico',location:'Lima · Híbrido'},{id:'operaciones',title:'Asistente de operaciones',location:'Callao · Presencial'}];
 const key='gtel-local-applications-v1';const status=document.querySelector('#local-status');let applications=[];
 try{const stored=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(stored))applications=stored.filter(a=>a&&jobs.some(j=>j.id===a.jobId));}catch{status.textContent='No se pudieron leer los datos locales.';}
 function save(next){try{localStorage.setItem(key,JSON.stringify(next));applications=next;render();return true;}catch{status.textContent='No se pudo guardar. Habilita el almacenamiento del navegador.';return false;}}
 function card(title,description,label,action){const article=document.createElement('article');const h=document.createElement('h3');h.textContent=title;const p=document.createElement('p');p.textContent=description;const button=document.createElement('button');button.type='button';button.className='secondary';button.textContent=label;button.onclick=action;article.append(h,p,button);return article;}
 function render(){const list=document.querySelector('#local-jobs');list.replaceChildren();for(const job of jobs){const applied=applications.some(a=>a.jobId===job.id);const item=card(job.title,job.location,applied?'Ya postulaste':'Postular en demo',()=>{if(applications.some(a=>a.jobId===job.id))return;if(save([...applications,{jobId:job.id,date:new Date().toLocaleDateString('es-PE')}]))status.textContent='Postulación de demostración guardada.';});item.querySelector('button').disabled=applied;list.append(item);}
 const own=document.querySelector('#local-applications');own.replaceChildren();if(!applications.length){const p=document.createElement('p');p.textContent='Aún no tienes postulaciones locales.';own.append(p);}
 for(const application of applications){const job=jobs.find(j=>j.id===application.jobId);own.append(card(job.title,'Recibida · '+application.date,'Retirar postulación',()=>save(applications.filter(a=>a.jobId!==job.id))));}}
 render();
})();
