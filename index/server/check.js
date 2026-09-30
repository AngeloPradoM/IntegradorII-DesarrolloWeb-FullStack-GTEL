import { loadConfig, connections, checkSchema } from './config.js';
let pool;
let stage='configuración';
try {
  loadConfig();
  stage='MySQL';
  const connectionsResult=connections(); pool=connectionsResult.pool;
  await checkSchema(pool);
  console.log('MySQL: conexión y tablas disponibles.');
  stage='Gmail SMTP';
  await connectionsResult.mailer.verify();
  console.log('Gmail SMTP: conexión y autenticación correctas (no se envió ningún correo).');
} catch(error) {console.error(stage==='configuración' ? error.message : `Falló la comprobación de ${stage}. Revisa sus credenciales, disponibilidad${stage==='MySQL'?' y estructura de tablas':''}.`);process.exitCode=1;}
finally {if(pool) await pool.end();}
