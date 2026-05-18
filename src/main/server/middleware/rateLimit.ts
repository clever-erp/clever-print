import { createMiddleware } from 'hono/factory';

interface Bucket {
  count: number;
  resetAt: number;
}

export function rateLimit(opts: { windowMs: number; max: number; keyFn?: (c: any) => string }) {
  const buckets = new Map<string, Bucket>();
  return createMiddleware(async (c, next) => {
    const key = opts.keyFn?.(c) ?? c.req.header('Origin') ?? c.req.header('x-forwarded-for') ?? 'global';
    const now = Date.now();
    const b = buckets.get(key);
    if (!b || b.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    } else {
      b.count += 1;
      if (b.count > opts.max) {
        return c.json({ error: 'rate_limited' }, 429);
      }
    }
    await next();
  });
}
