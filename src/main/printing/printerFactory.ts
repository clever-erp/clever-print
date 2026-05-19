import pkg from 'node-thermal-printer';
import type { PrinterConfig } from '@shared/types';
import { windowsRawDriver } from './windowsRawDriver';
import { logger } from '../logger';

const { printer: ThermalPrinter, types: PrinterTypes, CharacterSet } = pkg;

export type ThermalPrinterLike = InstanceType<typeof ThermalPrinter>;

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
    opts.driver = windowsRawDriver;
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
