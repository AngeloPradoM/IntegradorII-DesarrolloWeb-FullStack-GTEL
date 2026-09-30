import mysql from 'mysql2/promise';
import nodemailer from 'nodemailer';

export function loadConfig() {
  for (const key of ['DB_HOST','DB_NAME','DB_USER','SMTP_USER','SMTP_PASSWORD','OTP_SECRET']) {
    if (!process.env[key]) throw Error(`Completa ${key} en index/.env.`);
  }
  if (process.env.OTP_SECRET.length < 64) throw Error('OTP_SECRET debe tener al menos 64 caracteres aleatorios.');
  const port = Number(process.env.PORT || 3001);
  const dbPort = Number(process.env.DB_PORT || 3306);
  if (![port,dbPort].every(value=>Number.isInteger(value) && value>0 && value<=65535)) throw Error('PORT y DB_PORT deben ser puertos válidos entre 1 y 65535.');
  const origin = process.env.APP_ORIGIN || `http://localhost:${port}`;
  let url;
  try {url=new URL(origin);} catch {throw Error('APP_ORIGIN debe ser una URL válida.');}
  if (url.origin !== origin || !['http:','https:'].includes(url.protocol)) throw Error('APP_ORIGIN debe contener solo protocolo HTTP/HTTPS, dominio y puerto.');
  const admin = process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH ? {email:process.env.ADMIN_EMAIL.trim().toLowerCase(),hash:process.env.ADMIN_PASSWORD_HASH} : null;
  return {port, origin, secret:process.env.OTP_SECRET, sender:process.env.SMTP_USER,admin};
}

export async function checkSchema(pool) {
  await pool.query('SELECT id,nombres,apellidos,email,telefono,password_hash,email_verificado_en,activo,creado_en,actualizado_en FROM usuarios LIMIT 0');
  await pool.query('SELECT id,usuario_id,desafio_id,proposito,email_destino,codigo_hmac,intentos_fallidos,max_intentos,creado_en,enviado_en,expira_en,reenviar_desde,consumido_en,invalidado_en FROM verificaciones_email LIMIT 0');
  await pool.query('SELECT id,usuario_id,token_hash,creado_en,expira_en,revocado_en FROM sesiones LIMIT 0');
}
export function connections() {
  const pool = mysql.createPool({host:process.env.DB_HOST, port:Number(process.env.DB_PORT || 3306), user:process.env.DB_USER, password:process.env.DB_PASSWORD || '', database:process.env.DB_NAME, timezone:'Z', connectionLimit:5, multipleStatements:false});
  const mailer = nodemailer.createTransport({host:'smtp.gmail.com',port:465,secure:true,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD.replace(/\s/g,'')},connectionTimeout:10000,socketTimeout:15000});
  return {pool, mailer};
}
