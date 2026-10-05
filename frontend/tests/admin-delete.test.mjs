import assert from 'node:assert/strict';
import { createServer } from 'vite';
const server=await createServer({configFile:false,envDir:false,server:{middlewareMode:true,hmr:false}});
globalThis.localStorage={getItem:()=>JSON.stringify({token:'fixture'})};
try{
 const {deleteUser}=await server.ssrLoadModule('/src/services/adminService.js');
 globalThis.fetch=async(url,options)=>{
  assert.ok(url.endsWith('/api/admin/users/12'));
  assert.equal(options.method,'DELETE');assert.equal(options.headers.Authorization,'Bearer fixture');
  return new Response(null,{status:204});
 };
 assert.equal(await deleteUser(12),null);
 globalThis.fetch=async()=>Response.json({detail:'No puedes eliminar tu propia cuenta.'},{status:400});
 await assert.rejects(deleteUser(12),/propia cuenta/);
 console.log('PASS administrative deletion: authenticated DELETE, empty success and backend errors.');
}finally{await server.close();delete globalThis.localStorage;delete globalThis.fetch;}
