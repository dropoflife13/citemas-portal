import { createHmac, randomInt, timingSafeEqual } from 'crypto';

export const PASSWORD_RESET_TTL_MS = 10 * 60 * 1000;
export const PASSWORD_RESET_MAX_ATTEMPTS = 5;
export const PASSWORD_RESET_RESEND_DELAY_MS = 60 * 1000;

function getResetSecret() {
  const secret = process.env.PASSWORD_RESET_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error('Password recovery is not configured.');
  return secret;
}

export function createPasswordResetCode() {
  return String(randomInt(100000, 1000000));
}

export function hashPasswordResetCode(email, code) {
  return createHmac('sha256', getResetSecret())
    .update(`${email.toLowerCase()}:${code}`)
    .digest('hex');
}

export function passwordResetCodeMatches(email, code, storedHash) {
  if (!storedHash) return false;
  const expected = Buffer.from(hashPasswordResetCode(email, code), 'hex');
  const stored = Buffer.from(storedHash, 'hex');
  return expected.length === stored.length && timingSafeEqual(expected, stored);
}
