// Mirrors clever-front/src/types/index.ts (Order + OrderItem slice).
// Kept here so clever-print stays standalone; drift is guarded by tests.

export type OrderStatus =
  | 'payment_review'
  | 'payment_rejected'
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'voided';

export interface OrderItem {
  id: number;
  quantity: number;
  // Per unit; both include packaging_price.
  unit_price: number;
  original_unit_price?: number | null;
  // Per-unit packaging included in this line (absent on older dashboards/orders).
  packaging_price?: number | string | null;
  name: string;
  slug: string;
}

export interface OrderDiscount {
  type: string; // 'referral' | 'cashback'
  label: string;
  amount: number;
  pct?: number;
}

export interface Order {
  id: number;
  storeId: number;
  customerPhone: string;
  customerAlias?: string | null;
  status: OrderStatus;
  totalAmount: number;
  discount: number;
  deliveryFee?: number;
  deliveryDistanceKm?: number | null;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  items?: OrderItem[];
  // Itemized order-level discounts (referral, redeemed cashback); NULL for legacy orders.
  discounts?: OrderDiscount[] | null;
}

export type Locale = 'es-PE' | 'es-MX' | 'en-US';
export type Currency = 'PEN' | 'MXN' | 'USD';

/**
 * SUNAT electronic boleta, already issued and signed by clever-back + clever-sunat.
 * Mirrors `BillingDocument` in clever-front/src/services/billing.ts (the fields the ticket needs).
 * The agent only prints it: every amount comes computed, nothing is recalculated here.
 */
export interface InvoiceDocument {
  test: boolean; // beta: prints "PRUEBA – SIN VALOR TRIBUTARIO"
  fullNumber: string; // B001-00000124
  issuedAt: string; // ISO with -05:00
  customer: { docType: string; docNumber: string; name: string };
  lines: Array<{ description: string; quantity: number; unitPrice: number; valueAmount: number; igv: number; igvRate: number }>;
  totals: { taxed: number; exonerated: number; unaffected: number; igv: number; total: number };
  legend: string;
  issuer: {
    ruc: string;
    legalName: string;
    tradeName: string;
    regime: string | null;
    address: { line: string; district: string; province: string; department: string };
  };
  hash: string | null;
  qr: string | null;
}

export interface PrintRequest {
  jobId?: string;
  copies?: number;
  cutPaper?: boolean;
  openCashDrawer?: boolean;
  order: Order;
  store: {
    name: string;
    tiktokUrl?: string | null;
  };
  locale?: Locale;
  currency?: Currency;
  /** When present, prints the SUNAT boleta instead of the non-fiscal "RECIBO DE PEDIDO" (v0.2.0+). */
  invoice?: InvoiceDocument;
}

export interface PrintResponse {
  jobId: string;
  status: 'printed' | 'queued' | 'failed';
  durationMs?: number;
  error?: string;
}

export interface HealthResponse {
  ok: true;
  name: 'clever-print';
  version: string;
  paired: boolean;
  printerStatus: 'online' | 'offline' | 'unconfigured';
}

export type ConnectionType = 'windows' | 'usb' | 'network' | 'serial';
export type PrinterProfile = 'EPSON' | 'STAR';
export type PaperWidthMm = 58 | 80;
export type CodePage = 'PC437' | 'PC850' | 'WPC1252';

export interface PrinterConfig {
  connectionType: ConnectionType;
  /** For 'windows': Windows printer name. For 'usb': vendor:product hex (e.g. "0fe6:811e"). For 'network': "host:port". For 'serial': COM port. */
  identifier: string;
  paperWidthMm: PaperWidthMm;
  profile: PrinterProfile;
  codePage: CodePage;
  cutPaper: boolean;
  openCashDrawer: boolean;
}

export interface PairedOrigin {
  origin: string;
  token: string;       // 32-byte base64url, kept in memory only via timing-safe compare
  label?: string;
  pairedAt: string;
}

export interface ConfigShape {
  httpPort: number;
  autostart: boolean;
  printer: PrinterConfig | null;
  pairings: PairedOrigin[];
  logLevel: 'silly' | 'debug' | 'info' | 'warn' | 'error';
}

export type PendingStatus = 'awaiting' | 'approved' | 'rejected' | 'expired';

export interface Pending {
  id: string;
  origin: string;
  storeName: string;
  userEmail: string;
  code: string;
  status: PendingStatus;
  createdAt: number;
  expiresAt: number;
}

export interface DiscoveredPrinter {
  id: string;
  name: string;
  transport: 'windows-spooler' | 'usb' | 'network' | 'serial';
  default?: boolean;
}
