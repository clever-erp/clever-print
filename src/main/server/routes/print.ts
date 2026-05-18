import { Hono } from 'hono';
import { requirePairingToken } from '../middleware/auth';
import { executePrint, testPrint } from '../../printing/queue';
import type { PrintRequest } from '@shared/types';
import { logger } from '../../logger';

export const printRoute = new Hono();

printRoute.post('/print', requirePairingToken, async (c) => {
  let body: PrintRequest;
  try {
    body = (await c.req.json()) as PrintRequest;
  } catch {
    return c.json({ error: 'invalid_payload' }, 422);
  }
  if (!body?.order?.id || !Array.isArray(body.order.items)) {
    return c.json({ error: 'invalid_payload', detail: 'order.id and order.items required' }, 422);
  }
  try {
    const result = await executePrint(body);
    return c.json(result, result.status === 'failed' ? 500 : 200);
  } catch (err) {
    logger.error('print failed', err);
    return c.json({ error: 'print_failed', detail: (err as Error).message }, 500);
  }
});

printRoute.post('/test-print', requirePairingToken, async (c) => {
  try {
    const result = await testPrint();
    return c.json(result);
  } catch (err) {
    return c.json({ error: 'test_print_failed', detail: (err as Error).message }, 500);
  }
});
