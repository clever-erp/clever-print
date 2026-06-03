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
  unit_price: number;
  original_unit_price?: number | null;
  name: string;
  slug: string;
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
}

export type Locale = 'es-PE' | 'es-MX' | 'en-US';
export type Currency = 'PEN' | 'MXN' | 'USD';

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
