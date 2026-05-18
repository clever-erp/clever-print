import type { Order, OrderItem, PrintRequest, PaperWidthMm } from '@shared/types';
import type { ThermalPrinterLike } from './printerFactory';

const DEFAULT_LOCALE = 'es-PE';
const DEFAULT_CURRENCY = 'PEN';

function money(value: number, currency = DEFAULT_CURRENCY): string {
  const n = Number(value).toFixed(2);
  switch (currency) {
    case 'PEN': return `S/${n}`;
    case 'MXN': return `MX$${n}`;
    case 'USD': return `$${n}`;
    default: return n;
  }
}

function formatDate(iso: string, locale = DEFAULT_LOCALE): string {
  try {
    return new Date(iso).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function handleFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.replace(/^https?:\/\/(www\.)?tiktok\.com\//i, '').replace(/\/$/, '') || null;
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1) + '…';
}

function wrap(s: string, width: number): string[] {
  const out: string[] = [];
  for (const para of s.split(/\r?\n/)) {
    if (para.length <= width) { out.push(para); continue; }
    let buf = '';
    for (const word of para.split(/\s+/)) {
      if (!buf) { buf = word; continue; }
      if (buf.length + 1 + word.length <= width) buf += ' ' + word;
      else { out.push(buf); buf = word; }
    }
    if (buf) out.push(buf);
  }
  return out;
}

export interface RenderOptions {
  paperWidthMm: PaperWidthMm;
  locale?: string;
  currency?: string;
}

/**
 * Render the receipt to the given printer instance. The caller is responsible
 * for `await printer.execute()` and error handling.
 *
 * Layout mirrors `ThermalReceipt` in
 * clever-front/src/components/OrderDashboard/OrderDashboard.tsx:110-223.
 */
export async function renderReceipt(
  printer: ThermalPrinterLike,
  req: PrintRequest,
  opts: RenderOptions,
): Promise<void> {
  const { order, store } = req;
  const locale = req.locale ?? DEFAULT_LOCALE;
  const currency = req.currency ?? DEFAULT_CURRENCY;
  const width = opts.paperWidthMm === 80 ? 48 : 32;

  // Header
  printer.alignCenter();
  printer.bold(true);
  printer.println(truncate(store.name || 'Tienda', width));
  printer.println('RECIBO DE PEDIDO');
  printer.bold(false);
  printer.drawLine();

  // Meta
  printer.alignLeft();
  printer.leftRight('Pedido', `#${order.id}`);
  printer.leftRight('Fecha', formatDate(order.createdAt, locale));
  if (order.customerAlias) printer.leftRight('Cliente', truncate(order.customerAlias, width - 8));
  printer.leftRight('Tel', order.customerPhone);
  printer.drawLine();

  // Items
  printer.tableCustom([
    { text: 'Item', align: 'LEFT', width: 0.55, bold: true },
    { text: 'Cant', align: 'CENTER', width: 0.15, bold: true },
    { text: 'Total', align: 'RIGHT', width: 0.30, bold: true },
  ]);
  printer.drawLine();

  const items: OrderItem[] = order.items ?? [];
  if (items.length === 0) {
    printer.println('Sin items');
  } else {
    for (const it of items) {
      const lineTotal = it.quantity * Number(it.unit_price);
      const hasDiscount =
        it.original_unit_price != null && Number(it.original_unit_price) !== Number(it.unit_price);
      printer.tableCustom([
        { text: truncate(it.name, Math.floor(width * 0.55) - 1), align: 'LEFT', width: 0.55 },
        { text: String(it.quantity), align: 'CENTER', width: 0.15 },
        { text: money(lineTotal, currency), align: 'RIGHT', width: 0.30 },
      ]);
      let detail = `  ${it.quantity} x ${money(Number(it.unit_price), currency)}`;
      if (hasDiscount) {
        const pctOff = Math.round((1 - Number(it.unit_price) / Number(it.original_unit_price!)) * 100);
        detail += `  (antes ${money(Number(it.original_unit_price!), currency)}, -${pctOff}%)`;
      }
      printer.println(detail);
    }
  }

  printer.drawLine();

  const subtotalNet = items.reduce((s, it) => s + it.quantity * Number(it.unit_price), 0);
  const discount = Number(order.discount ?? 0);
  if (discount > 0) {
    printer.leftRight('Subtotal', money(subtotalNet + discount, currency));
    printer.leftRight('Descuento', `-${money(discount, currency)}`);
  }

  printer.bold(true);
  printer.leftRight('TOTAL', money(subtotalNet, currency));
  printer.bold(false);

  if (order.notes) {
    printer.drawLine();
    printer.println('Notas:');
    for (const line of wrap(order.notes, width)) printer.println(line);
  }

  printer.drawLine();
  printer.alignCenter();
  printer.println('¡Gracias por tu pedido!');

  const tikUrl = store.tiktokUrl?.trim() || null;
  if (tikUrl) {
    printer.println('Síguenos en TikTok');
    try {
      await printer.printQR(tikUrl, { cellSize: 6, correction: 'M', model: 2 });
    } catch {
      // Some printers don't support native QR — fall through silently.
    }
    const handle = handleFromUrl(tikUrl);
    if (handle) printer.println(handle);
  }

  if (req.cutPaper !== false) printer.cut();
  if (req.openCashDrawer) printer.openCashDrawer();
}

export function buildTestRequest(storeName: string): PrintRequest {
  const order: Order = {
    id: 0,
    storeId: 0,
    customerPhone: '999999999',
    customerAlias: 'PRUEBA',
    status: 'pending',
    totalAmount: 22,
    discount: 0,
    createdAt: new Date().toISOString(),
    items: [
      { id: 1, quantity: 1, unit_price: 22, name: 'Alitas Acevichadas x6', slug: 'alitas-acevichadas-x6' },
    ],
  };
  return {
    order,
    store: { name: storeName || 'Clever Print', tiktokUrl: null },
    locale: 'es-PE',
    currency: 'PEN',
    cutPaper: true,
  };
}
