import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import {createApp} from './app.js';
import {token} from './security.js';

test('Admin authorization, deletion, password reset and session revocation',async()=>{
  const password=token(),queries=[];
  const execute=async(sql,args)=>{
    queries.push({sql,args});
    if(sql.startsWith('SELECT COUNT'))return [[{total:1}]];
    if(sql.startsWith('SELECT id,nombres'))return [[{id:1,nombres:'Test',email:'test@example.test'}]];
    if(sql.startsWith('SELECT id FROM'))return [[{id:1}]];
    return [{affectedRows:1}];
  };
  const pool={execute,getConnection:async()=>({execute,beginTransaction:async()=>{},commit:async()=>{},rollback:async()=>{},release:()=>{}})};
  const app=createApp({pool,mailer:{},config:{origin:'http://localhost:3002',admin:{email:'admin@example.test',hash:await bcrypt.hash(password,4)}}});
  const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  const base=`http://127.0.0.1:${server.address().port}/api/admin`;
  let cookie='gtel_session='+token();
  const request=(path,method='GET',body)=>fetch(base+path,{method,headers:{Origin:'http://localhost:3002',Cookie:cookie,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
  try{
    assert.equal((await request('/users')).status,401);
    assert.equal((await request('/users/1','DELETE',{email:'test@example.test'})).status,401);
    assert.equal(queries.length,0);
    assert.equal((await request('/login','POST',{email:'admin@example.test',password:'wrong'})).status,401);
    const login=await request('/login','POST',{email:'admin@example.test',password});assert.equal(login.status,200);
    cookie=login.headers.get('set-cookie').split(';')[0];
    assert.match(login.headers.get('set-cookie'),/HttpOnly/);
    const users=await request('/users');assert.equal(users.status,200);assert.equal((await users.text()).includes('password'),false);
    const invalid=await request('/users/invalid','DELETE',{email:'test@example.test'});assert.equal(invalid.status,400);
    assert.equal((await request('/users/1','DELETE',{email:'test@example.test'})).status,200);
    assert(queries.some(q=>q.sql.startsWith('DELETE FROM usuarios')&&q.args[1]==='test@example.test'));
    const reset=await request('/users/1/password','POST',{email:'test@example.test'});assert.equal(reset.status,200);
    const result=await reset.json();const update=queries.find(q=>q.sql.startsWith('UPDATE usuarios'));
    assert(await bcrypt.compare(result.password,update.args[0]));
    assert(queries.some(q=>q.sql.startsWith('UPDATE sesiones')));
    assert(queries.some(q=>q.sql.startsWith('UPDATE verificaciones_email')));
    assert.equal((await request('/logout','POST',{})).status,200);
    assert.equal((await request('/users')).status,401);
  }finally{await new Promise(resolve=>server.close(resolve));}
});
