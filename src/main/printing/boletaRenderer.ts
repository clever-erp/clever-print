import type { InvoiceDocument } from '@shared/types';
import type { ThermalPrinterLike } from './printerFactory';

/** Catalog 06 labels for the customer document. */
const DOC_LABEL: Record<string, string> = { '1': 'DNI', '4': 'CE', '6': 'RUC', '7': 'PASAPORTE' };

const money = (n: number) => `S/${Number(n).toFixed(2)}`;

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1) + '…';
}

function wrap(s: string, width: number): string[] {
  const out: string[] = [];
  let buf = '';
  for (const word of s.split(/\s+/).filter(Boolean)) {
    if (!buf) buf = word;
    else if (buf.length + 1 + word.length <= width) buf += ' ' + word;
    else { out.push(buf); buf = word; }
  }
  if (buf) out.push(buf);
  return out;
}

/** "2026-10-26T13:42:00-05:00" → "26/10/2026 13:42" (already Lima wall time; no Date parsing). */
export function issuedAtLabel(iso: string): string {
  const [d, t] = iso.split('T');
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y} ${(t ?? '').slice(0, 5)}`.trim();
}

/**
 * Printed representation of a SUNAT boleta (80 or 58 mm). Mirrors `ThermalBoleta` in
 * clever-front/src/components/OrderDashboard/BoletaDialog.tsx. Customer phone is never printed
 * (Ley 29733); the document number is, because the receipt requires it.
 */
export async function renderBoleta(
  printer: ThermalPrinterLike,
  inv: InvoiceDocument,
  width: number,
): Promise<void> {
  const i = inv.issuer;
  printer.alignCenter();
  printer.bold(true);
  printer.println(truncate(i.tradeName || i.legalName, width));
  printer.bold(false);
  if (i.tradeName && i.tradeName !== i.legalName) printer.println(truncate(i.legalName, width));
  printer.println(`RUC ${i.ruc}`);
  for (const line of wrap([i.address.line, i.address.district, i.address.province].filter(Boolean).join(' - '), width)) {
    printer.println(line);
  }
  printer.drawLine();
  if (inv.test) {
    printer.bold(true);
    printer.println('PRUEBA - SIN VALOR TRIBUTARIO');
    printer.bold(false);
  }
  printer.bold(true);
  printer.println('BOLETA DE VENTA ELECTRONICA');
  printer.println(inv.fullNumber);
  printer.bold(false);

  printer.alignLeft();
  printer.leftRight('Fecha', issuedAtLabel(inv.issuedAt));
  if (inv.customer.docType === '0') {
    printer.leftRight('Cliente', truncate(inv.customer.name, width - 8));
  } else {
    printer.leftRight('Cliente', `${DOC_LABEL[inv.customer.docType] ?? 'DOC'} ${inv.customer.docNumber}`);
    for (const line of wrap(inv.customer.name, width)) printer.println(line);
  }
  printer.drawLine();

  for (const l of inv.lines) {
    for (const line of wrap(l.description, width)) printer.println(line);
    printer.leftRight(`  ${l.quantity} x ${money(l.unitPrice)}`, money(l.valueAmount + l.igv));
  }
  printer.drawLine();

  const t = inv.totals;
  if (t.igv > 0) {
    printer.leftRight('OP. GRAVADA', money(t.taxed));
  }
  if (t.exonerated > 0) printer.leftRight('OP. EXONERADA', money(t.exonerated));
  if (t.unaffected > 0) printer.leftRight('OP. INAFECTA', money(t.unaffected));
  if (t.igv > 0) printer.leftRight(`IGV (${inv.lines[0]?.igvRate ?? 0}%)`, money(t.igv));
  printer.bold(true);
  printer.leftRight('TOTAL', money(t.total));
  printer.bold(false);
  for (const line of wrap(inv.legend, width)) printer.println(line);
  if (i.regime === 'NRUS') printer.println('Contribuyente del Nuevo RUS');

  printer.drawLine();
  printer.alignCenter();
  if (inv.qr) {
    try {
      await printer.printQR(inv.qr, { cellSize: 4, correction: 'M', model: 2 });
    } catch {
      // Some printers don't support native QR; the hash and the legend below still identify it.
    }
  }
  if (inv.hash) printer.println(`Hash: ${inv.hash}`);
  for (const line of wrap('Representacion impresa de la Boleta de Venta Electronica. Consulte en sunat.gob.pe', width)) {
    printer.println(line);
  }
}
