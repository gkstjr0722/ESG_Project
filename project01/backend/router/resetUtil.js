// 비밀번호 토큰 관련 js 
import crypto from 'crypto';
import bcrypt from 'bcrypt';

export function genTokenRawHex(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}
export function sha256hex(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}
export async function hashPassword(plain) {
  const rounds = Number(process.env.BCRYPT_ROUNDS || 12);
  return bcrypt.hash(plain, rounds);
}
