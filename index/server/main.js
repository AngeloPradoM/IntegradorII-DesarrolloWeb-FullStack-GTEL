// Optional static file hosting only. No API, authentication, SQL or mail.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
const files=new Set(['index.html','editar-perfil.html','admin.html','styles.css','header.css','perfil.css','admin.css','preview.js','navigation.js','profile.js','profile-store.js','editar-perfil.js','admin.js']);
const mime={html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',js:'text/javascript; charset=utf-8'};
const server=createServer(async(req,res)=>{const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';if(!['GET','HEAD'].includes(req.method)||!files.has(name)){res.writeHead(404);res.end('Not found');return;}try{const content=await readFile(new URL('../'+name,import.meta.url));res.writeHead(200,{'Content-Type':mime[name.split('.').pop()],'Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:content);}catch{res.writeHead(404);res.end('Not found');}});
server.on('error',error=>{console.error('No se pudo abrir el servidor estático: '+error.code);process.exitCode=1;});
server.listen(Number(process.env.PORT||3001),'127.0.0.1',()=>console.log('Prototipo local: http://127.0.0.1:'+server.address().port));
