import { spawn } from 'node:child_process';
import { logger } from '../logger';
import type { DiscoveredPrinter } from '@shared/types';

export type { DiscoveredPrinter } from '@shared/types';

export async function listPrinters(): Promise<DiscoveredPrinter[]> {
  const out: DiscoveredPrinter[] = [];
  try {
    const wp = await listWindowsPrinters();
    out.push(...wp);
  } catch (err) {
    logger.warn('Failed to list Windows printers', err);
  }
  return out;
}

function listWindowsPrinters(): Promise<DiscoveredPrinter[]> {
  if (process.platform !== 'win32') return Promise.resolve([]);
  return new Promise((resolve) => {
    const args = [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      "Get-Printer | Select-Object Name, PortName, Default | ConvertTo-Json -Compress",
    ];
    const child = spawn('powershell.exe', args, { windowsHide: true });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (b) => { stdout += b.toString(); });
    child.stderr.on('data', (b) => { stderr += b.toString(); });
    child.on('error', (err) => {
      logger.error('PowerShell spawn failed', err);
      resolve([]);
    });
    child.on('close', (code) => {
      if (code !== 0) {
        logger.warn('Get-Printer exit', code, stderr);
        return resolve([]);
      }
      try {
        const raw = stdout.trim();
        if (!raw) return resolve([]);
        const parsed: any = JSON.parse(raw);
        const items = Array.isArray(parsed) ? parsed : [parsed];
        const printers: DiscoveredPrinter[] = items
          .filter((p) => typeof p?.Name === 'string')
          .map((p) => ({
            id: `win:${p.Name}`,
            name: p.Name,
            transport: 'windows-spooler' as const,
            default: !!p.Default,
          }));
        resolve(printers);
      } catch (err) {
        logger.error('Parse Get-Printer output failed', err, stdout);
        resolve([]);
      }
    });
  });
}
