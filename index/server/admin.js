import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { token, digest, normalizeEmail } from './security.js';

export function adminRouter({pool,config}) {
  const router=Router(), sessions=new Map();
  const options={httpOnly:true,sameSite:'strict',secure:config.origin.startsWith('https:'),path:'/api/admin'};
  const cookie=req=>(req.headers.cookie || '').split(';').map(s=>s.trim()).find(s=>s.startsWith('gtel_admin='))?.slice(11);
  const key=req=>digest(cookie(req) || '').toString('hex');
  const credentials=config.admin;
  router.post('/login',rateLimit({windowMs:15*60*1000,limit:10,standardHeaders:'draft-8',legacyHeaders:false,message:{message:'Demasiados intentos. Espera 15 minutos.'}}),async(req,res)=>{
    if (!credentials?.email || !credentials?.hash) return res.status(503).json({message:'Configura el administrador con npm run admin:setup -- tu-correo y reinicia el servidor.'});
    const password=req.body?.password;
    if (typeof password!=='string' || Buffer.byteLength(password)>72) return res.status(401).json({message:'Credenciales incorrectas.'});
    const valid=await bcrypt.compare(password,credentials.hash);
    if(!valid || normalizeEmail(req.body?.email)!==credentials.email) return res.status(401).json({message:'Credenciales incorrectas.'});
    for(const [id,expires] of sessions) if(expires<=Date.now()) sessions.delete(id);
    if(sessions.size>=20) sessions.delete(sessions.keys().next().value);
    sessions.delete(key(req));
    const session=token();sessions.set(digest(session).toString('hex'),Date.now()+60*60*1000);
    res.cookie('gtel_admin',session,{...options,maxAge:60*60*1000}).json({email:credentials.email});
  });
  router.post('/logout',(req,res)=>{sessions.delete(key(req));res.clearCookie('gtel_admin',options).json({ok:true});});
  router.use((req,res,next)=>{
    const id=key(req);
    if(!credentials || !sessions.has(id) || sessions.get(id)<=Date.now()) {sessions.delete(id);return res.status(401).json({message:'Inicia sesión como administrador.'});}
    next();
  });
  router.get('/me',(_req,res)=>res.json({email:credentials.email}));
  router.get('/users',async(req,res)=>{
    const search=typeof req.query.q==='string' ? req.query.q.trim().slice(0,100) : '';
    const page=Math.max(1,Math.min(100000,Number.parseInt(req.query.page,10)||1));
    const pattern='%'+search.replace(/[!%_]/g,'!$&')+'%';
    const where="WHERE email LIKE ? ESCAPE '!' OR nombres LIKE ? ESCAPE '!' OR apellidos LIKE ? ESCAPE '!'";
    const args=[pattern,pattern,pattern];
    const [[count]]=await pool.execute(`SELECT COUNT(*) AS total FROM usuarios ${where}`,args);
    const [users]=await pool.execute(`SELECT id,nombres,apellidos,email,telefono,activo,email_verificado_en,creado_en FROM usuarios ${where} ORDER BY id DESC LIMIT 20 OFFSET ${(page-1)*20}`,args);
    res.json({users,total:Number(count.total),page});
  });
  router.use('/users/:id',(req,res,next)=>{
    if(!/^[1-9]\d{0,19}$/.test(req.params.id)) return res.status(400).json({message:'Identificador no válido.'});
    next();
  });
  router.delete('/users/:id',async(req,res)=>{
    const [result]=await pool.execute('DELETE FROM usuarios WHERE id=? AND email=?',[req.params.id,normalizeEmail(req.body?.email)]);
    if(!result.affectedRows) return res.status(404).json({message:'Usuario no encontrado o correo de confirmación incorrecto.'});
    res.json({ok:true}); // Existing foreign keys cascade to codes and sessions.
  });
  router.post('/users/:id/password',async(req,res)=>{
    const password='Gt!9'+token().slice(0,20), hash=await bcrypt.hash(password,12);
    const db=await pool.getConnection();
    try {
      await db.beginTransaction();
      const [[user]]=await db.execute('SELECT id FROM usuarios WHERE id=? AND email=? FOR UPDATE',[req.params.id,normalizeEmail(req.body?.email)]);
      if(!user){await db.rollback();return res.status(404).json({message:'Usuario no encontrado o correo incorrecto.'});}
      await db.execute('UPDATE usuarios SET password_hash=? WHERE id=?',[hash,user.id]);
      await db.execute('UPDATE sesiones SET revocado_en=UTC_TIMESTAMP() WHERE usuario_id=? AND revocado_en IS NULL',[user.id]);
      await db.execute('UPDATE verificaciones_email SET invalidado_en=UTC_TIMESTAMP() WHERE usuario_id=? AND invalidado_en IS NULL AND consumido_en IS NULL',[user.id]);
      await db.commit();res.json({password});
    } catch(error){await db.rollback();throw error;}finally{db.release();}
  });
  return router;
}
