import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from './app.js';
import {token,signCode} from './security.js';

test('HTTP boundaries and OTP lifecycle with an isolated repository',async()=>{
  const secret=token(), id=token(), code='402718';
  const user={id:1,nombres:'Test',apellidos:'Fixture',email:'test@example.test',activo:1};
  const challenge={id:1,usuario_id:1,desafio_id:id,codigo_hmac:signCode(secret,id,code),vigente:1,enviado_en:new Date(),email_destino:user.email,intentos_fallidos:0,max_intentos:5,proposito:'INICIAR_SESION'};
  let sessions=0;
  const db={beginTransaction:async()=>{},commit:async()=>{},rollback:async()=>{},release:()=>{},execute:async(sql)=>{
    if(sql.startsWith('SELECT usuario_id'))return [[{usuario_id:1}]];
    if(sql.startsWith('SELECT * FROM usuarios'))return [[user]];
    if(sql.startsWith('SELECT *, expira_en'))return [[challenge]];
    if(sql.includes('SET intentos_fallidos=')){challenge.intentos_fallidos++;return [{}];}
    if(sql.includes('SET consumido_en=')){challenge.consumido_en=new Date();return [{}];}
    if(sql.startsWith('INSERT INTO sesiones')){sessions++;return [{}];}
    if(sql.startsWith('UPDATE usuarios'))return [{}];
    throw Error('Unexpected test query');
  }};
  const app=createApp({pool:{getConnection:async()=>db},mailer:{},config:{secret,origin:'http://localhost:3001',sender:'sender@example.test'}});
  const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const post=(body,origin='http://localhost:3001')=>fetch(base+'/api/auth/verify',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify(body)});
  try {
    assert.equal((await fetch(base+'/.env')).status,404);
    assert.equal((await fetch(base+'/server/app.js')).status,404);
    assert.equal((await fetch(base+'/api/me')).status,401);
    assert.equal((await post({challengeId:id,code},'https://foreign.example')).status,403);
    assert.equal((await post({challengeId:[id],code})).status,400);
    assert.equal((await post({challengeId:id,code:[code]})).status,400);
    const malformed=await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json',Origin:'http://localhost:3001'},body:'{"password":"private-test-value",'});
    assert.equal(malformed.status,400);
    assert.equal((await malformed.text()).includes('private-test-value'),false);
    assert.equal((await post({challengeId:id,code:'000000'})).status,400);
    assert.equal(challenge.intentos_fallidos,1);assert.equal(sessions,0);
    challenge.vigente=0;
    assert.equal((await post({challengeId:id,code})).status,400);
    challenge.vigente=1;challenge.intentos_fallidos=5;
    assert.equal((await post({challengeId:id,code})).status,400);
    challenge.intentos_fallidos=0;challenge.proposito='CONFIRMAR_EMAIL';
    const confirmation=await post({challengeId:id,code});
    assert.equal(confirmation.status,200);assert.equal(confirmation.headers.get('set-cookie'),null);assert.equal(sessions,0);
    challenge.consumido_en=null;challenge.proposito='INICIAR_SESION';
    const success=await post({challengeId:id,code});
    assert.equal(success.status,200);assert.equal(sessions,1);
    assert.match(success.headers.get('set-cookie'),/HttpOnly/);
    assert.match(success.headers.get('set-cookie'),/SameSite=Strict/);
    assert.equal((await post({challengeId:id,code})).status,400);assert.equal(sessions,1);
    for(let attempt=0;attempt<31;attempt++) await post({});
    assert.equal((await post({})).status,429);
    const logout=await fetch(base+'/api/auth/logout',{method:'POST',headers:{'Content-Type':'application/json',Origin:'http://localhost:3001'},body:'{}'});
    assert.equal(logout.status,200);
  } finally {await new Promise(resolve=>server.close(resolve));}
});
