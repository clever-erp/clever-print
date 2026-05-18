import { cors } from 'hono/cors';
import { getAllowedOrigins } from '../../config/store';

export function corsMiddleware() {
  return cors({
    origin: (origin) => {
      if (!origin) return null;
      // Always allow loopback access from the tray's own renderer (file:// origin or localhost dev).
      if (origin === 'null' || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
        return origin;
      }
      return getAllowedOrigins().includes(origin) ? origin : null;
    },
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'X-Pairing-Token', 'Authorization'],
    exposeHeaders: ['X-Agent-Version'],
    maxAge: 600,
    credentials: false,
  });
}
