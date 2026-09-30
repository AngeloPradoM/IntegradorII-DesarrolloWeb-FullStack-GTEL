import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

export const token = () => randomBytes(32).toString('hex');
export const digest = value => createHash('sha256').update(value).digest();
export const otp = () => String(randomInt(0, 1000000)).padStart(6, '0');
export const signCode = (secret, challenge, code) => createHmac('sha256', secret).update(`${challenge}:${code}`).digest();
export const matches = (left, right) => Buffer.isBuffer(left) && left.length === right.length && timingSafeEqual(left, right);
export const normalizeEmail = value => typeof value === 'string' ? value.trim().toLowerCase() : '';
export const validEmail = value => value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
export const maskEmail = email => email.replace(/^(.).*(@.*)$/, '$1***$2');
export function sessionToken(request) {
  const value = (request.headers.cookie || '').split(';').map(part => part.trim()).find(part => part.startsWith('gtel_session='))?.slice(13);
  return /^[a-f0-9]{64}$/.test(value || '') ? value : null;
}
