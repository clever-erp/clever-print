import { Hono } from 'hono';
import { app } from 'electron';
import { getConfig, isPaired } from '../../config/store';
import { isPrinterReachable } from '../../printing/printerFactory';

export const healthRoute = new Hono();

healthRoute.get('/health', async (c) => {
  const cfg = getConfig();
  let printerStatus: 'online' | 'offline' | 'unconfigured' = 'unconfigured';
  if (cfg.printer) {
    printerStatus = (await isPrinterReachable(cfg.printer)) ? 'online' : 'offline';
  }
  return c.json(
    {
      ok: true,
      name: 'clever-print',
      version: app.getVersion(),
      paired: isPaired(),
      printerStatus,
    },
    200,
    { 'X-Agent-Version': app.getVersion() },
  );
});
