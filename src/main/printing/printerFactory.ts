import pkg from 'node-thermal-printer';
import type { PrinterConfig } from '@shared/types';
import { logger } from '../logger';

const { printer: ThermalPrinter, types: PrinterTypes, CharacterSet } = pkg;

export type ThermalPrinterLike = InstanceType<typeof ThermalPrinter>;

// Windows spooler driver — only loaded when needed (and only on Windows where
// the native binding compiled).
let windowsDriver: unknown | null = null;
function loadWindowsDriver(): unknown {
  if (windowsDriver) return windowsDriver;
  try {
    // Use require so Vite's externalizeDepsPlugin keeps it external (native module).
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    windowsDriver = require('@thiagoelg/node-printer');
    return windowsDriver;
  } catch (err) {
    logger.error('Failed to load @thiagoelg/node-printer — Windows printing will not work', err);
    return null;
  }
}

function profileToType(profile: PrinterConfig['profile']) {
  return profile === 'STAR' ? PrinterTypes.STAR : PrinterTypes.EPSON;
}

function codePageToCharSet(cp: PrinterConfig['codePage']) {
  switch (cp) {
    case 'PC437': return CharacterSet.PC437_USA;
    case 'PC850': return CharacterSet.PC850_MULTILINGUAL;
    case 'WPC1252': return CharacterSet.WPC1252;
  }
}

function interfaceFor(cfg: PrinterConfig): string {
  switch (cfg.connectionType) {
    case 'windows': return `printer:${cfg.identifier}`;
    case 'network': {
      // identifier expected like "192.168.1.50:9100" or "192.168.1.50".
      const [host, port] = cfg.identifier.split(':');
      return `tcp://${host}:${port ?? '9100'}`;
    }
    case 'serial': return cfg.identifier; // e.g. COM3 / /dev/ttyUSB0
    case 'usb': return cfg.identifier.startsWith('usb') ? cfg.identifier : `usb`;
  }
}

export function buildPrinter(cfg: PrinterConfig): ThermalPrinterLike {
  const widthChars = cfg.paperWidthMm === 80 ? 48 : 32;
  const opts: any = {
    type: profileToType(cfg.profile),
    interface: interfaceFor(cfg),
    characterSet: codePageToCharSet(cfg.codePage),
    width: widthChars,
    removeSpecialCharacters: false,
    lineCharacter: '-',
    options: { timeout: 5000 },
  };
  if (cfg.connectionType === 'windows') {
    const drv = loadWindowsDriver();
    if (!drv) {
      throw new Error(
        '@thiagoelg/node-printer no se cargó. Ejecuta "pnpm install" para recompilar el módulo nativo, o cambia el tipo de conexión a Red / USB.',
      );
    }
    opts.driver = drv;
  }
  const printer = new ThermalPrinter(opts);
  return printer;
}

export async function isPrinterReachable(cfg: PrinterConfig): Promise<boolean> {
  try {
    const printer = buildPrinter(cfg);
    return await printer.isPrinterConnected();
  } catch (err) {
    logger.debug('isPrinterReachable threw', err);
    return false;
  }
}
