import { randomUUID } from 'node:crypto';
import { generateCode } from './token';
import { BrowserWindow } from 'electron';
import { IPC } from '@shared/ipc-channels';
import type { Pending } from '@shared/types';
import { logger } from '../logger';

export type { Pending } from '@shared/types';

const TTL_MS = 120_000;

const pendings = new Map<string, Pending>();

export function createPending(input: { origin: string; storeName: string; userEmail: string }): Pending {
  const id = `p_${randomUUID().replace(/-/g, '')}`;
  const now = Date.now();
  const pending: Pending = {
    id,
    origin: input.origin,
    storeName: input.storeName,
    userEmail: input.userEmail,
    code: generateCode(),
    status: 'awaiting',
    createdAt: now,
    expiresAt: now + TTL_MS,
  };
  pendings.set(id, pending);
  broadcastUpdate();
  setTimeout(() => {
    const p = pendings.get(id);
    if (p && p.status === 'awaiting') {
      p.status = 'expired';
      broadcastUpdate();
    }
  }, TTL_MS + 100);
  return pending;
}

export function confirmPending(pairingId: string, code: string): Pending | null {
  const p = pendings.get(pairingId);
  if (!p) return null;
  if (Date.now() > p.expiresAt) {
    p.status = 'expired';
    broadcastUpdate();
    return null;
  }
  if (p.code !== code) return null;
  // Allow "code confirms approval" — typing the code IS the approval action.
  if (p.status === 'awaiting') p.status = 'approved';
  return p;
}

export function approvePending(pairingId: string): Pending | null {
  const p = pendings.get(pairingId);
  if (!p) return null;
  if (Date.now() > p.expiresAt) {
    p.status = 'expired';
    broadcastUpdate();
    return null;
  }
  p.status = 'approved';
  broadcastUpdate();
  return p;
}

export function rejectPending(pairingId: string): Pending | null {
  const p = pendings.get(pairingId);
  if (!p) return null;
  p.status = 'rejected';
  broadcastUpdate();
  return p;
}

export function listPending(): Pending[] {
  const now = Date.now();
  return Array.from(pendings.values()).filter((p) => p.expiresAt > now || p.status !== 'awaiting');
}

function broadcastUpdate(): void {
  try {
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send(IPC.PAIR_PENDING, listPending());
    }
  } catch (err) {
    logger.error('broadcast pending failed', err);
  }
}

export function setupPairingApprovalHook(): void {
  // Periodic GC of stale pendings (older than 10 minutes after expiry).
  setInterval(() => {
    const cutoff = Date.now() - 10 * 60_000;
    for (const [id, p] of pendings) {
      if (p.expiresAt < cutoff) pendings.delete(id);
    }
  }, 60_000).unref?.();
}
