import { Hono } from 'hono';
import { requirePairingToken } from '../middleware/auth';
import { removePairing } from '../../config/store';

export const unpairRoute = new Hono();

unpairRoute.post('/unpair', requirePairingToken, async (c) => {
  const pairing = c.get('pairing');
  if (!pairing) return c.json({ error: 'unauthorized' }, 401);
  removePairing(pairing.origin);
  return c.json({ ok: true });
});
