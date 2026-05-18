import type { PrintRequest, PrintResponse } from '@shared/types';
import { getConfig } from '../config/store';
import { buildPrinter } from './printerFactory';
import { renderReceipt, buildTestRequest } from './escposRenderer';
import { setTrayStatus } from '../tray';
import { logger } from '../logger';

interface QueueEntry {
  jobId: string;
  result: Promise<PrintResponse>;
  expiresAt: number;
}

const dedupe = new Map<string, QueueEntry>();
let pending = 0;
let lastErr: string | null = null;

const DEDUPE_TTL_MS = 60_000;

export function queueDepth(): number {
  return pending;
}

export function lastError(): string | null {
  return lastErr;
}

export async function executePrint(req: PrintRequest): Promise<PrintResponse> {
  const jobId = req.jobId ?? `j_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // Idempotency
  const existing = dedupe.get(jobId);
  if (existing && existing.expiresAt > Date.now()) {
    logger.info('Returning cached print result', jobId);
    return existing.result;
  }

  const promise = doPrint(jobId, req);
  dedupe.set(jobId, { jobId, result: promise, expiresAt: Date.now() + DEDUPE_TTL_MS });
  setTimeout(() => {
    const e = dedupe.get(jobId);
    if (e && e.expiresAt <= Date.now()) dedupe.delete(jobId);
  }, DEDUPE_TTL_MS + 1000);
  return promise;
}

async function doPrint(jobId: string, req: PrintRequest): Promise<PrintResponse> {
  const cfg = getConfig();
  if (!cfg.printer) {
    lastErr = 'printer_unconfigured';
    return { jobId, status: 'failed', error: lastErr };
  }
  const start = Date.now();
  pending++;
  setTrayStatus('busy');
  try {
    const printer = buildPrinter(cfg.printer);
    const reachable = await printer.isPrinterConnected();
    if (!reachable) {
      lastErr = 'printer_offline';
      setTrayStatus('error');
      return { jobId, status: 'failed', error: lastErr };
    }
    const copies = Math.max(1, req.copies ?? 1);
    for (let i = 0; i < copies; i++) {
      await renderReceipt(printer, req, { paperWidthMm: cfg.printer.paperWidthMm });
      const ok = await printer.execute();
      printer.clear();
      if (!ok) {
        lastErr = 'execute_failed';
        setTrayStatus('error');
        return { jobId, status: 'failed', error: lastErr };
      }
    }
    lastErr = null;
    setTrayStatus('idle');
    return { jobId, status: 'printed', durationMs: Date.now() - start };
  } catch (err) {
    logger.error('Print failed', err);
    lastErr = (err as Error).message;
    setTrayStatus('error');
    return { jobId, status: 'failed', error: lastErr };
  } finally {
    pending = Math.max(0, pending - 1);
  }
}

export async function testPrint(): Promise<PrintResponse> {
  const cfg = getConfig();
  const name = cfg.printer ? 'Clever Print' : 'Clever Print (sin configurar)';
  return executePrint({ ...buildTestRequest(name), jobId: `test_${Date.now()}` });
}
