import express from 'express';
import { rateLimit } from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { adminRouter } from './admin.js';
import { fileURLToPath } from 'node:url';
import { token, digest, otp, signCode, matches, normalizeEmail, validEmail, maskEmail, sessionToken } from './security.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const fail = (status, message) => Object.assign(new Error(message), {status});
const publicUser = row => ({id:row.id,nombres:row.nombres,apellidos:row.apellidos,email:row.email,telefono:row.telefono || ''});

export function createApp({pool, mailer, config}) {
  const app = express();
  app.disable('x-powered-by');
  app.use((req,res,next) => {
    res.set('X-Content-Type-Options','nosniff');
    res.set('Referrer-Policy','same-origin');
    res.set('X-Frame-Options','DENY');
    if (req.path.startsWith('/api/')) {
      res.set('Cache-Control','no-store');
      if (req.method !== 'GET' && req.headers.origin !== config.origin) return res.status(403).json({message:'Origen no permitido. Abre la página desde el servidor local.'});
    }
    next();
  });
  app.use('/api', express.json({limit:'16kb'}));
  const limited = rateLimit({windowMs:15*60*1000,limit:30,standardHeaders:'draft-8',legacyHeaders:false,message:{message:'Demasiados intentos. Espera 15 minutos.'}});
  app.use(['/api/auth/register','/api/auth/login','/api/auth/resend','/api/auth/verify'], limited);
  // A second limiter prevents one source from repeatedly guessing a code.
  const verifyLimit = rateLimit({windowMs:15*60*1000,limit:20,standardHeaders:'draft-8',legacyHeaders:false,message:{message:'Demasiados intentos de verificación. Espera 15 minutos.'}});
  const cookieOptions = {httpOnly:true,sameSite:'strict',secure:config.origin.startsWith('https:'),path:'/'};

  async function issue(userId, purpose, previousChallenge, expectedPasswordHash) {
    const db = await pool.getConnection();
    try {
      await db.beginTransaction();
      const [[user]] = await db.execute('SELECT * FROM usuarios WHERE id=? AND activo=1 FOR UPDATE',[userId]);
      if (!user) throw fail(401,'Cuenta no disponible.');
      if (expectedPasswordHash && user.password_hash!==expectedPasswordHash) throw fail(401,'La contraseña cambió. Inicia sesión nuevamente.');
      if (previousChallenge) {
        const [[old]] = await db.execute('SELECT * FROM verificaciones_email WHERE desafio_id=? AND usuario_id=? FOR UPDATE',[previousChallenge,userId]);
        if (!old || old.consumido_en || old.invalidado_en || old.intentos_fallidos >= old.max_intentos || Date.now() - new Date(old.creado_en).getTime() > 30*60*1000) throw fail(400,'Inicia sesión nuevamente para solicitar otro código.');
      }
      const [[recent]] = await db.execute('SELECT id FROM verificaciones_email WHERE usuario_id=? AND reenviar_desde > UTC_TIMESTAMP() LIMIT 1',[userId]);
      if (recent) throw fail(429,'Espera 60 segundos antes de solicitar otro código.');
      const [[count]] = await db.execute('SELECT COUNT(*) AS total FROM verificaciones_email WHERE usuario_id=? AND creado_en > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 HOUR)',[userId]);
      if (count.total >= 10) throw fail(429,'Alcanzaste el límite de envíos. Inténtalo en una hora.');
      const challengeId = token(), code = otp();
      await db.execute('UPDATE verificaciones_email SET invalidado_en=UTC_TIMESTAMP() WHERE usuario_id=? AND consumido_en IS NULL AND invalidado_en IS NULL',[userId]);
      await db.execute('INSERT INTO verificaciones_email (usuario_id,desafio_id,proposito,email_destino,codigo_hmac,creado_en,expira_en,reenviar_desde) VALUES (?,?,?,?,?,UTC_TIMESTAMP(),DATE_ADD(UTC_TIMESTAMP(), INTERVAL 5 MINUTE),DATE_ADD(UTC_TIMESTAMP(), INTERVAL 60 SECOND))',[userId,challengeId,purpose,user.email,signCode(config.secret,challengeId,code)]);
      try {
        await mailer.sendMail({from:config.sender,to:user.email,subject:'GTEL · Código de verificación',text:`Tu código de verificación es: ${code}\n\nVence en 5 minutos y se usa una sola vez. No lo compartas. Si no solicitaste este acceso, ignora este correo.`});
      } catch { throw fail(503,'No se pudo enviar el correo. Revisa la configuración de Gmail e inténtalo nuevamente.'); }
      await db.execute('UPDATE verificaciones_email SET enviado_en=UTC_TIMESTAMP() WHERE desafio_id=?',[challengeId]);
      await db.commit();
      return {challengeId,purpose,email:maskEmail(user.email),expiresIn:300,retryAfter:60};
    } catch (error) {await db.rollback();throw error;} finally {db.release();}
  }

  app.post('/api/auth/register', async (req,res) => {
    const body = req.body || {}, email = normalizeEmail(body.email);
    if (!validEmail(email) || !['nombres','apellidos'].every(key=>typeof body[key] === 'string' && body[key].trim().length >= 2 && body[key].length <= 100) || typeof body.password !== 'string' || Buffer.byteLength(body.password) > 72 || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(body.password) || typeof body.telefono !== 'string' || !/^\d{9}$/.test(body.telefono)) throw fail(400,'Revisa los nombres, correo, teléfono y contraseña (8 caracteres mínimo, mayúscula, minúscula, número y símbolo; máximo 72 bytes).');
    let result;
    try {
      [result] = await pool.execute('INSERT INTO usuarios (nombres,apellidos,email,telefono,password_hash,creado_en,actualizado_en) VALUES (?,?,?,?,?,UTC_TIMESTAMP(),UTC_TIMESTAMP())',[body.nombres.trim(),body.apellidos.trim(),email,body.telefono,await bcrypt.hash(body.password,12)]);
    } catch(error) {if(error.code==='ER_DUP_ENTRY') throw fail(409,'Este correo ya está registrado. Inicia sesión para continuar.');throw error;}
    try {res.status(201).json(await issue(result.insertId,'CONFIRMAR_EMAIL'));}
    catch(error) {if(error.status) error.message = `La cuenta se creó, pero no se pudo enviar el código. Inicia sesión para reintentarlo. ${error.message}`;throw error;}
  });
  const dummyHash = bcrypt.hashSync(token(),12);
  app.post('/api/auth/login',async(req,res)=>{
    const email = normalizeEmail(req.body?.email), password = req.body?.password;
    if (!validEmail(email) || typeof password !== 'string' || Buffer.byteLength(password)>72) throw fail(401,'Correo o contraseña incorrectos.');
    const [[user]] = await pool.execute('SELECT * FROM usuarios WHERE email=?',[email]);
    const valid = await bcrypt.compare(password,user?.password_hash || dummyHash);
    if (!valid || !user?.activo) throw fail(401,'Correo o contraseña incorrectos.');
    res.json(await issue(user.id,user.email_verificado_en ? 'INICIAR_SESION' : 'CONFIRMAR_EMAIL',undefined,user.password_hash));
  });
  app.post('/api/auth/resend',async(req,res)=>{
    const id=req.body?.challengeId;
    if (typeof id !== 'string' || !/^[a-f0-9]{64}$/.test(id)) throw fail(400,'Solicitud no válida.');
    const [[challenge]]=await pool.execute('SELECT * FROM verificaciones_email WHERE desafio_id=?',[id]);
    if (!challenge) throw fail(400,'Inicia sesión nuevamente.');
    res.json(await issue(challenge.usuario_id,challenge.proposito,id));
  });
  app.post('/api/auth/verify',verifyLimit,async(req,res)=>{
    const {challengeId,code}=req.body || {};
    if (typeof challengeId !== 'string' || typeof code !== 'string' || !/^[a-f0-9]{64}$/.test(challengeId) || !/^\d{6}$/.test(code)) throw fail(400,'Introduce el código de seis dígitos.');
    const db=await pool.getConnection();
    try {
      await db.beginTransaction();
      // Lock in the same order as issuance to serialize resends and verification.
      const [[reference]]=await db.execute('SELECT usuario_id FROM verificaciones_email WHERE desafio_id=?',[challengeId]);
      if (!reference) throw fail(400,'Código vencido o no disponible.');
      const [[user]]=await db.execute('SELECT * FROM usuarios WHERE id=? AND activo=1 FOR UPDATE',[reference.usuario_id]);
      const [[challenge]]=await db.execute('SELECT *, expira_en > UTC_TIMESTAMP() AS vigente FROM verificaciones_email WHERE desafio_id=? FOR UPDATE',[challengeId]);
      if (!user || !challenge || !challenge.vigente || !challenge.enviado_en || challenge.invalidado_en || challenge.consumido_en || challenge.intentos_fallidos>=challenge.max_intentos || challenge.email_destino!==user.email) throw fail(400,'Código vencido o no disponible. Solicita uno nuevo.');
      if (!matches(challenge.codigo_hmac,signCode(config.secret,challengeId,code))) {
        await db.execute('UPDATE verificaciones_email SET intentos_fallidos=intentos_fallidos+1 WHERE id=?',[challenge.id]);
        await db.commit();
        return res.status(400).json({message:'Código incorrecto. Tienes un máximo de cinco intentos.'});
      }
      await db.execute('UPDATE verificaciones_email SET consumido_en=UTC_TIMESTAMP() WHERE id=?',[challenge.id]);
      if (challenge.proposito==='CONFIRMAR_EMAIL') {
        await db.execute('UPDATE usuarios SET email_verificado_en=UTC_TIMESTAMP() WHERE id=?',[user.id]);
        await db.commit();
        return res.json({verified:true,message:'Correo confirmado. Ya puedes iniciar sesión.'});
      }
      const session=token();
      await db.execute('INSERT INTO sesiones (usuario_id,token_hash,creado_en,expira_en) VALUES (?,?,UTC_TIMESTAMP(),DATE_ADD(UTC_TIMESTAMP(), INTERVAL 8 HOUR))',[user.id,digest(session)]);
      await db.commit();
      res.cookie('gtel_session',session,{...cookieOptions,maxAge:8*60*60*1000});
      res.json({user:publicUser(user)});
    } catch(error) {await db.rollback();throw error;} finally {db.release();}
  });
  app.get('/api/me',async(req,res)=>{
    const session=sessionToken(req);
    if (!session) throw fail(401,'Inicia sesión.');
    const [[user]]=await pool.execute('SELECT u.* FROM sesiones s JOIN usuarios u ON u.id=s.usuario_id WHERE s.token_hash=? AND s.revocado_en IS NULL AND s.expira_en>UTC_TIMESTAMP() AND u.activo=1',[digest(session)]);
    if (!user) throw fail(401,'La sesión venció. Inicia sesión.');
    res.json({user:publicUser(user)});
  });
  app.post('/api/auth/logout',async(req,res)=>{
    const session=sessionToken(req);
    if (session) await pool.execute('UPDATE sesiones SET revocado_en=UTC_TIMESTAMP() WHERE token_hash=?',[digest(session)]);
    res.clearCookie('gtel_session',cookieOptions).json({ok:true});
  });
  app.use('/api/admin',adminRouter({pool,config}));
  app.use('/api',(_req,res)=>res.status(404).json({message:'Ruta no encontrada.'}));
  // Allowlist: .env, server sources and node_modules are never served.
  for (const name of ['admin.html','admin.js','admin.css','index.html','styles.css','header.css','preview.js','profile.js','profile-store.js','navigation.js','editar-perfil.html','editar-perfil.js','perfil.css']) {
    app.get(name==='index.html' ? ['/', '/index.html'] : `/${name}`,(_req,res)=>res.sendFile(name,{root}));
  }
  app.use((error,_req,res,_next)=>{
    if (error.type === 'entity.parse.failed') return res.status(400).json({message:'El formato de la solicitud no es válido.'});
    if (error.type === 'entity.too.large') return res.status(413).json({message:'La solicitud supera el tamaño permitido.'});
    const status=error.status || 500;
    res.status(status).json({message:status<500 || status===503 ? error.message : 'No se pudo completar la operación. Comprueba la conexión y las tablas de MySQL.'});
  });
  return app;
}
