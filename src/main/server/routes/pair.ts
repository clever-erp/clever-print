import { Hono } from 'hono';
import { rateLimit } from '../middleware/rateLimit';
import { createPending, confirmPending } from '../../pairing/code';
import { addPairing } from '../../config/store';
import { generateToken } from '../../pairing/token';
import { ensureConfigWindow } from '../../windows/configWindow';
import { logger } from '../../logger';

export const pairRoute = new Hono();

const pairLimiter = rateLimit({ windowMs: 60_000, max: 3 });

pairRoute.post('/pair', pairLimiter, async (c) => {
  let body: { origin?: string; storeName?: string; userEmail?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_payload' }, 422);
  }
  const origin = body.origin;
  if (!origin || !/^https?:\/\//.test(origin)) {
    return c.json({ error: 'invalid_payload', detail: 'origin must be a valid URL' }, 422);
  }
  const pending = createPending({
    origin,
    storeName: body.storeName ?? '',
    userEmail: body.userEmail ?? '',
  });
  // Raise the tray window so the user can see + approve.
  ensureConfigWindow('pairing');
  logger.info('Pairing requested', { origin, storeName: body.storeName });
  return c.json({ pairingId: pending.id, expiresAt: new Date(pending.expiresAt).toISOString() });
});

pairRoute.post('/pair/confirm', async (c) => {
  let body: { pairingId?: string; code?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_payload' }, 422);
  }
  if (!body.pairingId || !body.code) {
    return c.json({ error: 'invalid_payload' }, 422);
  }
  const pending = confirmPending(body.pairingId, body.code);
  if (!pending) {
    return c.json({ error: 'invalid_or_expired' }, 401);
  }
  if (pending.status !== 'approved') {
    return c.json({ error: 'not_approved' }, 403);
  }
  const token = generateToken();
  addPairing({
    origin: pending.origin,
    token,
    label: pending.storeName || pending.origin,
    pairedAt: new Date().toISOString(),
  });
  logger.info('Pairing confirmed', { origin: pending.origin });
  return c.json({ token, origin: pending.origin });
});
