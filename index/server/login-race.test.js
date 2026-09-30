import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import {createApp} from './app.js';
import {token} from './security.js';

test('Password reset during login prevents issuance of a new code',async()=>{
  const password=token(), hash=await bcrypt.hash(password,4);
  let mailCount=0,rolledBack=false;
  const user={id:1,email:'fixture@example.test',activo:1,email_verificado_en:new Date(),password_hash:hash};
  const pool={execute:async()=>[[user]],getConnection:async()=>({
    beginTransaction:async()=>{},execute:async()=>[[{...user,password_hash:'changed-by-admin'}]],
    rollback:async()=>{rolledBack=true;},release:()=>{},
  })};
  const app=createApp({pool,mailer:{sendMail:async()=>{mailCount++;}},config:{origin:'http://localhost:3002',secret:token()}});
  const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  try{
    const response=await fetch(`http://127.0.0.1:${server.address().port}/api/auth/login`,{method:'POST',headers:{Origin:'http://localhost:3002','Content-Type':'application/json'},body:JSON.stringify({email:user.email,password})});
    assert.equal(response.status,401);assert.equal(mailCount,0);assert.equal(rolledBack,true);
  }finally{await new Promise(resolve=>server.close(resolve));}
});
