import { Hono } from 'hono';
import { requirePairingToken } from '../middleware/auth';
import { listPrinters } from '../../printing/windowsPrinters';

export const printersRoute = new Hono();

printersRoute.get('/printers', requirePairingToken, async (c) => {
  const printers = await listPrinters();
  return c.json({ printers });
});
