import { cors } from 'hono/cors';
import { getAllowedOrigins } from '../../config/store';

// Discovery + pairing endpoints must be reachable by any frontend origin —
// the cashier hasn't paired yet, so we can't know their CloudFront URL.
// These responses carry no secrets and the pairing handshake itself is
// phishing-resistant (user reads a 6-digit code off their own tray window).
const PUBLIC_PATHS = new Set(['/health', '/pair', '/pair/confirm']);

export function corsMiddleware() {
  return cors({
    origin: (origin, c) => {
      if (PUBLIC_PATHS.has(c.req.path)) {
        return origin ?? '*';
      }
      if (!origin) return null;
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
