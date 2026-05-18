import { createMiddleware } from 'hono/factory';
import { timingSafeEqual } from 'node:crypto';
import { getAllowedOrigins } from '../../config/store';
import { findPairingByToken } from '../../config/store';

export const requirePairingToken = createMiddleware(async (c, next) => {
  const tokenHeader = c.req.header('X-Pairing-Token') ?? c.req.header('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!tokenHeader) {
    return c.json({ error: 'unauthorized' }, 401);
  }

  const origin = c.req.header('Origin') ?? '';
  // Origin must be either an allowlisted paired origin or our own renderer (no origin).
  if (origin && !getAllowedOrigins().includes(origin) && !origin.startsWith('http://localhost') && !origin.startsWith('http://127.0.0.1')) {
    return c.json({ error: 'forbidden_origin' }, 403);
  }

  const pairing = findPairingByToken(tokenHeader);
  if (!pairing) {
    return c.json({ error: 'unauthorized' }, 401);
  }

  // Constant-time guard against length-mismatch leaks in addition to lookup parity.
  const a = Buffer.from(tokenHeader);
  const b = Buffer.from(pairing.token);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return c.json({ error: 'unauthorized' }, 401);
  }

  // Origin must match the pairing's origin (defence in depth).
  if (origin && pairing.origin !== origin) {
    return c.json({ error: 'origin_token_mismatch' }, 403);
  }

  c.set('pairing', pairing);
  await next();
});

declare module 'hono' {
  interface ContextVariableMap {
    pairing: ReturnType<typeof findPairingByToken>;
  }
}
