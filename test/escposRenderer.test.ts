import { describe, it, expect } from 'vitest';
import { buildTestRequest, lineBreakdown, renderReceipt } from '../src/main/printing/escposRenderer';
import type { Order } from '../src/shared/types';

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

// The worked example agreed for packaging (item + packaging, item discount on
// price + packaging, then order-level discounts and delivery).
const ORDER_WITH_PACKAGING: Order = {
  id: 200,
  storeId: 2,
  customerPhone: 'x',
  status: 'delivered',
  totalAmount: 88.06,
  discount: 14.84,
  deliveryFee: 8.5,
  deliveryDistanceKm: 4.2,
  createdAt: '2026-10-14T20:00:00Z',
  discounts: [
    { type: 'first_purchase', label: 'Descuento primera compra', amount: 10.34, pct: 10 },
    { type: 'cashback', label: 'Cashback canjeado', amount: 5 },
  ],
  items: [
    { id: 1, quantity: 1, unit_price: 27.9, original_unit_price: null, packaging_price: 1, name: 'Primer Pecado - Soberbia', slug: 'a' },
    { id: 2, quantity: 1, unit_price: 25.5, original_unit_price: 30, packaging_price: '1.00', name: 'Segundo Pecado - Avaricia', slug: 'b' },
    { id: 3, quantity: 2, unit_price: 22.5, original_unit_price: null, packaging_price: 0.5, name: 'Alitas BBQ x6', slug: 'c' },
    { id: 4, quantity: 1, unit_price: 5, original_unit_price: null, packaging_price: 0, name: 'Coca Cola', slug: 'd' },
  ],
};

describe('lineBreakdown', () => {
  it('splits product, packaging and item discount', () => {
    const [soberbia, avaricia, alitas, coca] = ORDER_WITH_PACKAGING.items!.map(lineBreakdown);
    expect(soberbia).toMatchObject({ productUnit: 26.9, packagingTotal: 1, discountTotal: 0, lineTotal: 27.9 });
    expect(avaricia).toMatchObject({ productUnit: 29, packagingTotal: 1, discountTotal: 4.5, discountPct: 15, lineTotal: 25.5 });
    expect(alitas).toMatchObject({ productUnit: 22, productTotal: 44, packagingUnit: 0.5, packagingTotal: 1, lineTotal: 45 });
    expect(coca).toMatchObject({ productUnit: 5, packagingTotal: 0, discountTotal: 0, lineTotal: 5 });
  });

  it('treats legacy items (no packaging_price) as before', () => {
    const l = lineBreakdown({ id: 9, quantity: 1, unit_price: 24.65, original_unit_price: 29, name: 'x', slug: 'x' });
    expect(l).toMatchObject({ productUnit: 29, packagingTotal: 0, discountTotal: 4.35, discountPct: 15, lineTotal: 24.65 });
  });
});

describe('renderReceipt', () => {
  it('prints per-line sub-lines and order-level discounts', async () => {
    const out: string[] = [];
    const fake: any = new Proxy({}, {
      get: (_t, prop) => (...args: unknown[]) => {
        if (prop === 'println') out.push(String(args[0]));
        if (prop === 'leftRight') out.push(`${args[0]} | ${args[1]}`);
      },
    });
    await renderReceipt(fake, { order: ORDER_WITH_PACKAGING, store: { name: 'La Gula' } }, { paperWidthMm: 80 });
    expect(out).toContain('  1 x S/29.00 | S/29.00');
    expect(out).toContain('  + Packaging | S/1.00');
    expect(out).toContain('  - Descuento 15% | -S/4.50');
    expect(out).toContain('  + Packaging (2 x S/0.50) | S/1.00');
    expect(out).toContain('  1 x S/5.00');
    expect(out).toContain('Subtotal | S/103.40');
    expect(out).toContain('Descuento primera compra (10%) | -S/10.34');
    expect(out).toContain('Cashback canjeado | -S/5.00');
    expect(out).toContain('Envio | S/8.50');
    expect(out).toContain('TOTAL | S/96.56');
  });
});
