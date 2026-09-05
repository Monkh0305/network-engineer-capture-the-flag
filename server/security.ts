import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const PASSWORD_PREFIX = 'scrypt';
const PASSWORD_KEY_LENGTH = 64;

export function isPasswordHash(value: string): boolean {
  return value.startsWith(`${PASSWORD_PREFIX}$`);
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString('hex');
  return `${PASSWORD_PREFIX}$${salt}$${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [prefix, salt, encodedKey] = storedHash.split('$');
  if (prefix !== PASSWORD_PREFIX || !salt || !encodedKey) return false;

  try {
    const storedKey = Buffer.from(encodedKey, 'hex');
    const suppliedKey = scryptSync(password, salt, storedKey.length);
    return storedKey.length === suppliedKey.length && timingSafeEqual(storedKey, suppliedKey);
  } catch {
    return false;
  }
}

export function createSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
