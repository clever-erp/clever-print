import { Hono } from 'hono';
import { serve, type ServerType } from '@hono/node-server';
import { corsMiddleware } from './middleware/cors';
import { healthRoute } from './routes/health';
import { pairRoute } from './routes/pair';
import { printRoute } from './routes/print';
import { printersRoute } from './routes/printers';
import { statusRoute } from './routes/status';
import { unpairRoute } from './routes/unpair';
import { logger } from '../logger';
import { app as electronApp } from 'electron';

const PORT_FALLBACK_RANGE = 10; // try 17777..17786

let server: ServerType | null = null;
let listenPort: number | null = null;

export async function startHttpServer(preferredPort: number): Promise<number> {
  const honoApp = new Hono();
  honoApp.use('*', corsMiddleware());
  honoApp.use('*', async (c, next) => {
    c.header('X-Agent-Version', electronApp.getVersion());
    await next();
  });
  honoApp.route('/', healthRoute);
  honoApp.route('/', pairRoute);
  honoApp.route('/', printRoute);
  honoApp.route('/', printersRoute);
  honoApp.route('/', statusRoute);
  honoApp.route('/', unpairRoute);

  for (let i = 0; i < PORT_FALLBACK_RANGE; i++) {
    const port = preferredPort + i;
    try {
      server = await tryListen(honoApp, port);
      listenPort = port;
      logger.info(`HTTP server listening on http://127.0.0.1:${port}`);
      return port;
    } catch (err: any) {
      if (err?.code === 'EADDRINUSE') {
        logger.warn(`Port ${port} busy, trying next…`);
        continue;
      }
      throw err;
    }
  }
  throw new Error(`No free port in range ${preferredPort}..${preferredPort + PORT_FALLBACK_RANGE - 1}`);
}

function tryListen(honoApp: Hono, port: number): Promise<ServerType> {
  return new Promise((resolve, reject) => {
    const s = serve({ fetch: honoApp.fetch, hostname: '127.0.0.1', port }, () => resolve(s));
    s.on('error', (err) => reject(err));
  });
}

export async function stopHttpServer(): Promise<void> {
  if (!server) return;
  await new Promise<void>((resolve) => server!.close(() => resolve()));
  server = null;
  listenPort = null;
}

export function getListenPort(): number | null {
  return listenPort;
}
