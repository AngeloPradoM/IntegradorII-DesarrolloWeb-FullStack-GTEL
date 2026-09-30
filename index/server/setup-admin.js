import fs from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import {token,normalizeEmail,validEmail} from './security.js';
const email=normalizeEmail(process.argv[2]);
if(!validEmail(email)) {console.error('Uso: npm.cmd run admin:setup -- tu-correo@gmail.com');process.exit(1);}
const path=new URL('../.env',import.meta.url);
let source=await fs.readFile(path,'utf8');
const password='Gt!9'+token().slice(0,24);
const hash=await bcrypt.hash(password,12);
for(const [name,value] of Object.entries({ADMIN_EMAIL:email,ADMIN_PASSWORD_HASH:hash})) {
  const expression=new RegExp('^'+name+'=.*$','m');
  source=expression.test(source)?source.replace(expression,()=>name+'='+value):source.trimEnd()+'\n'+name+'='+value+'\n';
}
await fs.writeFile(path,source);
console.log('Administrador configurado. Reinicia el servidor. Guarda esta contraseña; solo se muestra ahora:');
console.log(password);
