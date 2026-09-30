import { loadConfig, connections, checkSchema } from './config.js';
import { createApp } from './app.js';
try {
  const config=loadConfig();
  const {pool,mailer}=connections();
  await checkSchema(pool);
  createApp({pool,mailer,config}).listen(config.port,'127.0.0.1',(error)=>{
    if (error) {
      console.error(error.code==='EADDRINUSE'
        ? `El puerto ${config.port} ya está ocupado. Cambia PORT y APP_ORIGIN en index/.env.`
        : `No se pudo iniciar el servidor (${error.code || 'error de escucha'}).`);
      pool.end().finally(()=>process.exit(1));
      return;
    }
    console.log(`GTEL pruebas: ${config.origin}`);
  });
} catch(error) {console.error(error.code ? 'No se pudo conectar a MySQL. Revisa index/.env y las tablas.' : error.message);process.exit(1);}
