import { z } from 'zod';

export const PrinterConfigSchema = z.object({
  connectionType: z.enum(['windows', 'usb', 'network', 'serial']),
  identifier: z.string().min(1),
  paperWidthMm: z.union([z.literal(58), z.literal(80)]),
  profile: z.enum(['EPSON', 'STAR']),
  codePage: z.enum(['PC437', 'PC850', 'WPC1252']),
  cutPaper: z.boolean(),
  openCashDrawer: z.boolean(),
});

export const PairedOriginSchema = z.object({
  origin: z.string().url(),
  token: z.string().min(20),
  label: z.string().optional(),
  pairedAt: z.string(),
});

export const ConfigSchema = z.object({
  httpPort: z.number().int().min(1024).max(65535).default(17777),
  autostart: z.boolean().default(true),
  printer: PrinterConfigSchema.nullable().default(null),
  pairings: z.array(PairedOriginSchema).default([]),
  logLevel: z.enum(['silly', 'debug', 'info', 'warn', 'error']).default('info'),
});

export type ConfigShape = z.infer<typeof ConfigSchema>;
