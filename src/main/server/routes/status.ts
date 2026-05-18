import { Hono } from 'hono';
import { app } from 'electron';
import { requirePairingToken } from '../middleware/auth';
import { getConfig } from '../../config/store';
import { isPrinterReachable } from '../../printing/printerFactory';
import { queueDepth, lastError } from '../../printing/queue';

const started = Date.now();

export const statusRoute = new Hono();

statusRoute.get('/status', requirePairingToken, async (c) => {
  const cfg = getConfig();
  const online = cfg.printer ? await isPrinterReachable(cfg.printer) : false;
  return c.json({
    printer: cfg.printer
      ? {
          id: cfg.printer.identifier,
          connectionType: cfg.printer.connectionType,
          paperWidthMm: cfg.printer.paperWidthMm,
          online,
          lastError: lastError(),
        }
      : null,
    queue: { pending: queueDepth() },
    agent: { version: app.getVersion(), uptimeSec: Math.round((Date.now() - started) / 1000) },
  });
});
