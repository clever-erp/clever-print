import { describe, it, expect } from 'vitest';
import { buildTestRequest } from '../src/main/printing/escposRenderer';

// Smoke test only — full byte-stream assertions require a fake transport hook
// in node-thermal-printer, which we will add in a follow-up.

describe('buildTestRequest', () => {
  it('produces a sane fixture for La Gula', () => {
    const req = buildTestRequest('La Gula');
    expect(req.order.id).toBe(0);
    expect(req.order.items?.length).toBe(1);
    expect(req.order.items?.[0]?.name).toMatch(/Alitas/);
    expect(req.store.name).toBe('La Gula');
    expect(req.locale).toBe('es-PE');
    expect(req.currency).toBe('PEN');
  });
});
