import { randomBytes } from 'node:crypto';

export function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

export function generateCode(): string {
  // 6-digit numeric code, zero-padded.
  const n = randomBytes(3).readUIntBE(0, 3) % 1_000_000;
  return n.toString().padStart(6, '0');
}
